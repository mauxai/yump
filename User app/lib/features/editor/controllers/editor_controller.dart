import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/common/controller/template_model.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/repo/projects_repo.dart';
import 'package:photo_manager/photo_manager.dart';
import '../models/draw_stroke.dart';
import '../../../util/app_constants.dart';
import '../../../util/enums.dart';

class EditorController extends GetxController implements GetxService {
  final ProjectsRepo _projectsRepo;

  EditorController({required ProjectsRepo projectsRepo}) : _projectsRepo = projectsRepo;

  // ── Meta ──────────────────────────────────────────────────────────────────

  String projectName = 'Untitled';
  bool isGenerating = false;
  bool isLoadingVersion = false;
  bool isSaving = false;
  EditorTool? selectedTool;
  Templates? selectedTemplate;
  bool get hasSelectedTemplate => selectedTemplate != null;
  bool get isLassoActive => selectedTool == EditorTool.lasso;
  bool showOriginal = false;
  Uint8List? imageBytes;
  Uint8List? originalImageBytes;
  Size imageNaturalSize = Size.zero;
  String? _projectId;

  // ── Edit History ──────────────────────────────────────────────────────────

  final List<Edits> _editHistory = [];
  List<Edits> get editHistory => List.unmodifiable(_editHistory);

  int _currentIndex = -1;
  int get currentIndex => _currentIndex;

  // Incremented only on explicit user navigation so AnimatedSwitcher doesn't
  // fire on automatic transitions (e.g. history loading on entry).
  int _navigationStamp = 0;
  int get navigationStamp => _navigationStamp;

  // Byte cache — full-res bytes for every edit version, preloaded on entry
  // so history navigation is instant.
  final Map<String, Uint8List> _bytesCache = {};

  // ── Lasso / Shape state ───────────────────────────────────────────────────

  final List<Offset> lassoPoints = [];
  bool lassoClosed = false;
  ShapeOption selectedShape = ShapeOption.circle;
  Offset? _shapeStartPoint;

  // ── Crop state ────────────────────────────────────────────────────────────

  Rect? cropRect;
  CropHandle? _activeCropHandle;
  bool showCropGrid = false;
  String cropAspectRatio = 'free';
  Size canvasSize = Size.zero;
  bool _needsCropInit = false;

  // ── Draw / Brush state ────────────────────────────────────────────────────

  final List<DrawStroke> drawStrokes = [];
  DrawStroke? currentDrawStroke;
  Color brushColor = Colors.white;
  double brushSize = 10.0;
  BrushStyle brushStyle = BrushStyle.basic;

  // ── Init ──────────────────────────────────────────────────────────────────

  Future<void> init(String path, String name, {String? projectId}) async {
    _projectId = projectId;
    projectName = name;
    imageBytes = null;
    originalImageBytes = null;
    imageNaturalSize = Size.zero;
    _editHistory.clear();
    _bytesCache.clear();
    _currentIndex = -1;
    _navigationStamp = 0;
    selectedTool = null;
    selectedTemplate = null;
    isLoadingVersion = false;
    _resetToolState();
    update();
    await _loadImage(path);
    if (_projectId != null) {
      await _fetchEditHistory(path);
    }
    update();
  }

  void _resetToolState() {
    lassoPoints.clear();
    lassoClosed = false;
    _shapeStartPoint = null;
    selectedShape = ShapeOption.circle;
    cropRect = null;
    _activeCropHandle = null;
    showCropGrid = false;
    cropAspectRatio = 'free';
    canvasSize = Size.zero;
    _needsCropInit = false;
    drawStrokes.clear();
    currentDrawStroke = null;
    brushColor = Colors.white;
    brushSize = 10.0;
    brushStyle = BrushStyle.basic;
  }

  // ── History loading ───────────────────────────────────────────────────────

  // Fetches edit metadata, silently downloads the matching version into cache,
  // auto-selects it on entry, and loads the true original into originalImageBytes
  // without touching the canvas display.
  Future<void> _fetchEditHistory(String imagePath) async {
    try {
      final response = await _projectsRepo.getProjectDetails(_projectId!);
      if (response.statusCode != 200 || response.body == null) return;
      final project = Projects.fromJson(response.body['project']);

      final edits = project.edits;
      if (edits != null) {
        for (final edit in edits) {
          if (edit.image == null || edit.id == null) continue;
          _editHistory.add(edit);
        }
      }

      if (_editHistory.isNotEmpty) {
        final matchedIndex = _editHistory.indexWhere((e) => e.image == imagePath);
        final targetIndex = matchedIndex >= 0 ? matchedIndex : _editHistory.length - 1;
        // imageBytes already holds the target edit's bytes (loaded from imagePath
        // in init). Seed the cache with them so no redundant network request is made.
        final targetId = _editHistory[targetIndex].id;
        if (targetId != null && imageBytes != null) {
          _cacheBytes(targetId, imageBytes!);
        }
        await _silentLoadVersionBytes(targetIndex);
        _currentIndex = targetIndex;
        _preloadAll(targetIndex);
      }

      // Load original silently — only used by the "Original" history slot thumbnail.
      if (project.originalImage != null && _editHistory.isNotEmpty) {
        _loadOriginalSilently(project.originalImage!);
      }
    } catch (_) {}
  }

  void _loadOriginalSilently(String url) {
    http.get(Uri.parse(url)).then((resp) {
      originalImageBytes = resp.bodyBytes;
      update();
    }).catchError((_) {});
  }

  Future<void> _loadImage(String path) async {
    try {
      final Uint8List bytes;
      if (path.startsWith('http://') || path.startsWith('https://')) {
        final response = await http.get(Uri.parse(path));
        bytes = response.bodyBytes;
      } else {
        bytes = await File(path).readAsBytes();
      }
      imageBytes = bytes;
      await _decodeImageSize(bytes);
      update();
    } catch (_) {
      showCustomSnackBar('image_load_failed'.tr);
    }
  }

  Future<void> _decodeImageSize(Uint8List bytes) async {
    try {
      final codec = await ui.instantiateImageCodec(bytes);
      final frame = await codec.getNextFrame();
      imageNaturalSize = Size(frame.image.width.toDouble(), frame.image.height.toDouble());
      frame.image.dispose();
    } catch (_) {}
  }

  // Returns the rect where the image is displayed within the canvas using BoxFit.contain.
  Rect _imageRect(Size canvas) {
    if (imageNaturalSize == Size.zero || canvas == Size.zero) {
      return Rect.fromLTWH(0, 0, canvas.width, canvas.height);
    }
    final scale = min(canvas.width / imageNaturalSize.width, canvas.height / imageNaturalSize.height);
    final w = imageNaturalSize.width * scale;
    final h = imageNaturalSize.height * scale;
    return Rect.fromLTWH((canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  Rect get currentImageRect => _imageRect(canvasSize);

  Offset _clampToImageRect(Offset pos) {
    final r = _imageRect(canvasSize);
    return Offset(pos.dx.clamp(r.left, r.right), pos.dy.clamp(r.top, r.bottom));
  }

  // Downloads bytes for a single version and stores in LRU cache.
  Future<void> _loadVersionBytes(int index) async {
    if (index < 0 || index >= _editHistory.length) return;
    final edit = _editHistory[index];
    if (edit.id == null || edit.image == null) return;
    if (_bytesCache.containsKey(edit.id)) return;

    isLoadingVersion = true;
    update();
    try {
      final resp = await http.get(Uri.parse(edit.image!));
      _cacheBytes(edit.id!, resp.bodyBytes);
    } catch (_) {
      showCustomSnackBar('image_load_failed'.tr);
    } finally {
      isLoadingVersion = false;
      update();
    }
  }

  void _cacheBytes(String id, Uint8List bytes) {
    _bytesCache[id] = bytes;
  }

  // Downloads one version into the cache silently — no loading state, awaitable.
  Future<void> _silentLoadVersionBytes(int index) async {
    if (index < 0 || index >= _editHistory.length) return;
    final edit = _editHistory[index];
    if (edit.id == null || edit.image == null) return;
    if (_bytesCache.containsKey(edit.id!)) return;
    try {
      final resp = await http.get(Uri.parse(edit.image!));
      _cacheBytes(edit.id!, resp.bodyBytes);
    } catch (_) {}
  }

  // Fire-and-forget preload of every history version, skipping the given index
  // (which is loaded synchronously elsewhere). Ensures instant navigation.
  void _preloadAll(int skipIndex) {
    for (int i = 0; i < _editHistory.length; i++) {
      if (i == skipIndex) continue;
      final edit = _editHistory[i];
      if (edit.id == null || edit.image == null) continue;
      if (_bytesCache.containsKey(edit.id!)) continue;
      http.get(Uri.parse(edit.image!)).then((resp) {
        _cacheBytes(edit.id!, resp.bodyBytes);
      }).catchError((_) {});
    }
  }

  // ── Tool selection ────────────────────────────────────────────────────────

  List<Offset> healPoints = [];

  void clearHealStrokes() {
    healPoints.clear();
    update();
  }

  Future<void> applySpotHeal() async {
    if (healPoints.isEmpty) return;
    const prompt = 'Remove and heal the areas marked with colored circles. Fill them in naturally, matching the surrounding background and texture seamlessly.';
    await generateEdit(promptOverride: prompt);
    clearHealStrokes();
    selectTool(null);
  }

  Future<void> enhanceImage() async {
    const prompt = 'Enhance the overall image quality — sharpen fine details, reduce noise, and improve clarity while keeping it natural.';
    await generateEdit(promptOverride: prompt);
  }

  Future<void> removeBackground() async {
    const prompt = 'Remove the background completely and isolate the subject on a clean transparent or white background.';
    await generateEdit(promptOverride: prompt);
  }

  Future<void> generateEdit({required String promptOverride}) async {
    final dashCtrl = Get.find<DashboardController>();
    final modelId = dashCtrl.aiModelList.firstOrNull?.id ?? '';
    await applyEdit(promptOverride, modelId);
  }

  void selectTool(EditorTool? tool) {
    final wasActive = selectedTool == EditorTool.crop;
    selectedTool = selectedTool == tool ? null : tool;
    if (!wasActive && selectedTool == EditorTool.crop) _needsCropInit = true;
    update();
  }

  // ── History navigation ────────────────────────────────────────────────────

  bool get canUndo => _currentIndex >= 0 && !isGenerating;
  bool get canRedo => _currentIndex < _editHistory.length - 1 && !isGenerating;

  void undo() {
    if (!canUndo) return;
    jumpToVersion(_currentIndex - 1);
  }

  void redo() {
    if (!canRedo) return;
    jumpToVersion(_currentIndex + 1);
  }

  Future<void> jumpToVersion(int index) async {
    if (isGenerating) return;
    _currentIndex = index;
    _navigationStamp++;
    drawStrokes.clear();
    currentDrawStroke = null;
    lassoPoints.clear();
    lassoClosed = false;
    _shapeStartPoint = null;
    update();
    if (index >= 0) {
      await _loadVersionBytes(index);
    }
    final bytes = currentDisplayBytes;
    if (bytes != null) await _decodeImageSize(bytes);
    update();
  }

  void setShowOriginal(bool show) {
    showOriginal = show;
    update();
  }

  Uint8List? get currentDisplayBytes {
    if (_currentIndex >= 0 && _currentIndex < _editHistory.length) {
      final id = _editHistory[_currentIndex].id;
      return id != null ? _bytesCache[id] : null;
    }
    return originalImageBytes ?? imageBytes;
  }

  String get versionLabel {
    if (_editHistory.isEmpty || _currentIndex < 0) return '';
    return 'v${_currentIndex + 1} · ${'edited'.tr}';
  }

  Future<void> saveImage() async {
    final bytes = currentDisplayBytes;
    if (bytes == null) return;

    isSaving = true;
    update();

    try {
      final ps = await PhotoManager.requestPermissionExtend(
        requestOption: const PermissionRequestOption(
          iosAccessLevel: IosAccessLevel.addOnly,
        ),
      );
      if (!ps.isAuth) {
        showCustomSnackBar('save_permission_denied'.tr);
        return;
      }

      final timestamp = DateTime.now().millisecondsSinceEpoch;
      await PhotoManager.editor.saveImage(
        bytes,
        filename: '${AppConstants.appName}_$timestamp',
      );
      showCustomSnackBar('image_saved'.tr, isError: false);
    } catch (_) {
      showCustomSnackBar('save_failed'.tr);
    } finally {
      isSaving = false;
      update();
    }
  }



  void selectTemplate(Templates template) {
    selectedTemplate = template;
    update();
  }

  void clearTemplate() {
    if (selectedTemplate == null) return;
    selectedTemplate = null;
    update();
  }

  Future<void> applyEdit(String prompt, String aiModelId, {String? templateId}) async {
    if (Get.find<ConfigController>().isDemoMode) {
      showCustomSnackBar('demo_mode_edit_disabled'.tr);
      return;
    }
    final currentBytes = currentDisplayBytes;
    if (currentBytes == null) return;

    isGenerating = true;
    update();

    try {
      if (_projectId == null) {
        showCustomSnackBar('apply_edit_failed'.tr);
        return;
      }

      final parentId = _currentIndex >= 0 ? _editHistory[_currentIndex].id : null;
      final response = await _projectsRepo.applyEdit(
        _projectId!, prompt, parentId, currentBytes, aiModelId,
        templateId: templateId,
      );

      if (response.statusCode != 200 || response.body == null) {
        showCustomSnackBar('apply_edit_failed'.tr);
        return;
      }

      final edit = Edits.fromJson(response.body['edit']);
      if (edit.image != null && edit.id != null) {
        final imageResponse = await http.get(Uri.parse(edit.image!));
        _cacheBytes(edit.id!, imageResponse.bodyBytes);
      }
      _editHistory.add(edit);
      _currentIndex = _editHistory.length - 1;
      selectedTool = null;
      selectedTemplate = null;
      clearLasso();
      Get.find<ProjectsController>().loadProjects(shouldUpdate: false);
    } catch (_) {
      showCustomSnackBar('apply_edit_failed'.tr);
    } finally {
      isGenerating = false;
      update();
    }
  }

  // ── Lasso ─────────────────────────────────────────────────────────────────

  void onLassoPanUpdate(DragUpdateDetails d) {
    if (!isLassoActive || lassoClosed || canvasSize == Size.zero) return;
    final r = _imageRect(canvasSize);
    final pos = _clampToImageRect(d.localPosition);
    lassoPoints.add(Offset((pos.dx - r.left) / r.width, (pos.dy - r.top) / r.height));
    update();
  }

  void onLassoPanEnd(DragEndDetails _) {
    if (!isLassoActive || lassoPoints.length < 3) return;
    lassoClosed = true;
    update();
  }

  void clearLasso() {
    lassoPoints.clear();
    lassoClosed = false;
    _shapeStartPoint = null;
    update();
  }

  // ── Shape ─────────────────────────────────────────────────────────────────

  void onShapePanStart(DragStartDetails d) {
    lassoPoints.clear();
    lassoClosed = false;
    _shapeStartPoint = _clampToImageRect(d.localPosition);
    update();
  }

  void onShapePanUpdate(DragUpdateDetails d) {
    if (_shapeStartPoint == null || canvasSize == Size.zero) return;
    final r = _imageRect(canvasSize);
    final clampedEnd = _clampToImageRect(d.localPosition);
    final pts = _shapePoints(_shapeStartPoint!, clampedEnd);
    lassoPoints
      ..clear()
      ..addAll(pts.map((p) => Offset((p.dx - r.left) / r.width, (p.dy - r.top) / r.height)));
    lassoClosed = false;
    update();
  }

  void onShapePanEnd(DragEndDetails _) {
    if (lassoPoints.length >= 3) {
      lassoClosed = true;
      update();
    }
  }

  void setSelectedShape(ShapeOption shape) {
    selectedShape = shape;
    clearLasso();
  }

  List<Offset> _shapePoints(Offset s, Offset e) {
    final minX = min(s.dx, e.dx);
    final maxX = max(s.dx, e.dx);
    final minY = min(s.dy, e.dy);
    final maxY = max(s.dy, e.dy);
    final cx = (minX + maxX) / 2;
    final cy = (minY + maxY) / 2;

    switch (selectedShape) {
      case ShapeOption.circle:
        final rx = (maxX - minX) / 2;
        final ry = (maxY - minY) / 2;
        return List.generate(48, (i) {
          final a = 2 * pi * i / 48;
          return Offset(cx + cos(a) * rx, cy + sin(a) * ry);
        });
      case ShapeOption.square:
        return [Offset(minX, minY), Offset(maxX, minY), Offset(maxX, maxY), Offset(minX, maxY)];
      case ShapeOption.triangle:
        return [Offset(cx, minY), Offset(minX, maxY), Offset(maxX, maxY)];
      case ShapeOption.heart:
        final w = (maxX - minX) / 2;
        final h = maxY - minY;
        return List.generate(60, (i) {
          final t = 2 * pi * i / 60;
          final rawX = 16 * pow(sin(t), 3).toDouble();
          final rawY = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t));
          return Offset(cx + (rawX / 16) * w, minY + ((rawY + 12) / 29) * h);
        });
      case ShapeOption.star:
        final rx = (maxX - minX) / 2;
        final ry = (maxY - minY) / 2;
        return List.generate(10, (i) {
          final angle = pi * i / 5 - pi / 2;
          final r = i.isEven ? 1.0 : 0.4;
          return Offset(cx + cos(angle) * r * rx, cy + sin(angle) * r * ry);
        });
    }
  }

  // ── Crop ──────────────────────────────────────────────────────────────────

  void setCanvasSize(Size size) {
    if (canvasSize == size && !_needsCropInit) return;
    canvasSize = size;
    if (_needsCropInit) {
      _needsCropInit = false;
      initCropRect();
    }
  }

  void initCropRect() {
    if (canvasSize == Size.zero) return;
    const margin = 24.0;
    final ir = _imageRect(canvasSize);
    cropRect = Rect.fromLTRB(ir.left + margin, ir.top + margin, ir.right - margin, ir.bottom - margin);
    cropAspectRatio = 'free';
    update();
  }

  CropHandle? _detectHandle(Offset pos) {
    final r = cropRect!;
    final cx = r.center.dx;
    final cy = r.center.dy;

    final candidates = {
      CropHandle.topLeft: r.topLeft,
      CropHandle.top: Offset(cx, r.top),
      CropHandle.topRight: r.topRight,
      CropHandle.right: Offset(r.right, cy),
      CropHandle.bottomRight: r.bottomRight,
      CropHandle.bottom: Offset(cx, r.bottom),
      CropHandle.bottomLeft: r.bottomLeft,
      CropHandle.left: Offset(r.left, cy),
    };

    for (final entry in candidates.entries) {
      if ((pos - entry.value).distance < AppConstants.cropHandleHitRadius) {
        return entry.key;
      }
    }
    if (r.contains(pos)) return CropHandle.move;
    return null;
  }

  void onCropPanStart(DragStartDetails d) {
    if (cropRect == null) return;
    _activeCropHandle = _detectHandle(d.localPosition);
    showCropGrid = _activeCropHandle != null;
    update();
  }

  void onCropPanUpdate(DragUpdateDetails d) {
    if (cropRect == null || _activeCropHandle == null) return;
    final delta = d.delta;
    Rect r = cropRect!;
    final ir = _imageRect(canvasSize);
    const minSize = AppConstants.minCropSize;

    switch (_activeCropHandle!) {
      case CropHandle.topLeft:
        r = Rect.fromLTRB(
          (r.left + delta.dx).clamp(ir.left, r.right - minSize),
          (r.top + delta.dy).clamp(ir.top, r.bottom - minSize),
          r.right, r.bottom);
      case CropHandle.top:
        r = Rect.fromLTRB(r.left, (r.top + delta.dy).clamp(ir.top, r.bottom - minSize), r.right, r.bottom);
      case CropHandle.topRight:
        r = Rect.fromLTRB(
          r.left,
          (r.top + delta.dy).clamp(ir.top, r.bottom - minSize),
          (r.right + delta.dx).clamp(r.left + minSize, ir.right),
          r.bottom);
      case CropHandle.right:
        r = Rect.fromLTRB(r.left, r.top, (r.right + delta.dx).clamp(r.left + minSize, ir.right), r.bottom);
      case CropHandle.bottomRight:
        r = Rect.fromLTRB(
          r.left, r.top,
          (r.right + delta.dx).clamp(r.left + minSize, ir.right),
          (r.bottom + delta.dy).clamp(r.top + minSize, ir.bottom));
      case CropHandle.bottom:
        r = Rect.fromLTRB(r.left, r.top, r.right, (r.bottom + delta.dy).clamp(r.top + minSize, ir.bottom));
      case CropHandle.bottomLeft:
        r = Rect.fromLTRB(
          (r.left + delta.dx).clamp(ir.left, r.right - minSize),
          r.top, r.right,
          (r.bottom + delta.dy).clamp(r.top + minSize, ir.bottom));
      case CropHandle.left:
        r = Rect.fromLTRB((r.left + delta.dx).clamp(ir.left, r.right - minSize), r.top, r.right, r.bottom);
      case CropHandle.move:
        final nx = (r.left + delta.dx).clamp(ir.left, ir.right - r.width);
        final ny = (r.top + delta.dy).clamp(ir.top, ir.bottom - r.height);
        r = Rect.fromLTWH(nx, ny, r.width, r.height);
    }
    cropRect = r;
    update();
  }

  void onCropPanEnd(DragEndDetails _) {
    _activeCropHandle = null;
    showCropGrid = false;
    update();
  }

  void applyAspectRatioPreset(String ratio) {
    cropAspectRatio = ratio;
    update();
    if (ratio == 'free' || canvasSize == Size.zero) return;

    final ratioMap = {
      '1:1': 1.0, '4:3': 4.0 / 3.0, '3:4': 3.0 / 4.0,
      '16:9': 16.0 / 9.0, '9:16': 9.0 / 16.0,
    };
    final target = ratioMap[ratio]!;
    const margin = 24.0;
    final ir = _imageRect(canvasSize);
    final maxW = ir.width - margin * 2;
    final maxH = ir.height - margin * 2;

    double w, h;
    if (target > maxW / maxH) {
      w = maxW;
      h = w / target;
    } else {
      h = maxH;
      w = h * target;
    }

    cropRect = Rect.fromCenter(center: ir.center, width: w, height: h);
    update();
  }

  Future<void> applyCrop() async {
    if (cropRect == null || canvasSize == Size.zero) return;
    final rect = cropRect!;
    final size = canvasSize;
    final currentBytes = currentDisplayBytes;
    if (currentBytes == null) return;

    isGenerating = true;
    update();
    try {
      final codec = await ui.instantiateImageCodec(currentBytes);
      final frame = await codec.getNextFrame();
      final image = frame.image;

      final imageW = image.width.toDouble();
      final imageH = image.height.toDouble();
      final scale = min(size.width / imageW, size.height / imageH);
      final offsetX = (size.width - imageW * scale) / 2;
      final offsetY = (size.height - imageH * scale) / 2;

      final srcLeft = ((rect.left - offsetX) / scale).clamp(0.0, imageW);
      final srcTop = ((rect.top - offsetY) / scale).clamp(0.0, imageH);
      final srcRight = ((rect.right - offsetX) / scale).clamp(0.0, imageW);
      final srcBottom = ((rect.bottom - offsetY) / scale).clamp(0.0, imageH);
      final srcRect = Rect.fromLTRB(srcLeft, srcTop, srcRight, srcBottom);

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      canvas.drawImageRect(image, srcRect, Rect.fromLTWH(0, 0, srcRect.width, srcRect.height), Paint());
      final picture = recorder.endRecording();
      final cropped = await picture.toImage(srcRect.width.round(), srcRect.height.round());
      final byteData = await cropped.toByteData(format: ui.ImageByteFormat.png);
      final croppedBytes = byteData!.buffer.asUint8List();

      imageNaturalSize = Size(srcRect.width, srcRect.height);

      if (_currentIndex < 0) {
        imageBytes = croppedBytes;
      } else {
        final id = _editHistory[_currentIndex].id;
        if (id != null) _cacheBytes(id, croppedBytes);
      }

      cropRect = null;
      cropAspectRatio = 'free';
      selectedTool = null;
      update();
    } catch (_) {
      showCustomSnackBar('apply_edit_failed'.tr);
    } finally {
      isGenerating = false;
      update();
    }
  }

  void cancelCrop() {
    selectedTool = null;
    cropRect = null;
    cropAspectRatio = 'free';
    _needsCropInit = false;
    update();
  }

  // ── Draw / Brush ──────────────────────────────────────────────────────────

  void onDrawPanStart(DragStartDetails d) {
    currentDrawStroke = DrawStroke(
      points: [_clampToImageRect(d.localPosition)],
      color: brushColor,
      size: brushSize,
      style: brushStyle,
    );
    update();
  }

  void onDrawPanUpdate(DragUpdateDetails d) {
    if (currentDrawStroke == null) return;
    currentDrawStroke!.points.add(_clampToImageRect(d.localPosition));
    update();
  }

  void onDrawPanEnd(DragEndDetails _) {
    if (currentDrawStroke == null) return;
    if (currentDrawStroke!.points.length >= 2) {
      drawStrokes.add(currentDrawStroke!);
    }
    currentDrawStroke = null;
    update();
  }

  void undoStroke() {
    if (drawStrokes.isEmpty) return;
    drawStrokes.removeLast();
    update();
  }

  void clearStrokes() {
    drawStrokes.clear();
    currentDrawStroke = null;
    update();
  }

  void setBrushStyle(BrushStyle style) {
    brushStyle = style;
    update();
  }

  void setBrushColor(Color color) {
    brushColor = color;
    update();
  }

  void setBrushSize(double size) {
    brushSize = size;
    update();
  }

  Future<void> doneBrush() async {
    if (drawStrokes.isEmpty) {
      selectTool(EditorTool.brush);
      return;
    }
    if (currentDrawStroke != null && currentDrawStroke!.points.length >= 2) {
      drawStrokes.add(currentDrawStroke!);
      currentDrawStroke = null;
    }

    final snapshot = List<DrawStroke>.from(drawStrokes);
    await _applyDrawing(snapshot);
    drawStrokes.clear();
    update();
  }

  // ── Canvas gesture dispatcher ─────────────────────────────────────────────

  void onPanStart(DragStartDetails d) {
    switch (selectedTool) {
      case EditorTool.crop:  onCropPanStart(d);
      case EditorTool.brush: onDrawPanStart(d);
      case EditorTool.shape: onShapePanStart(d);
      default: break;
    }
  }

  void onPanUpdate(DragUpdateDetails d) {
    switch (selectedTool) {
      case EditorTool.crop:  onCropPanUpdate(d);
      case EditorTool.brush: onDrawPanUpdate(d);
      case EditorTool.shape: onShapePanUpdate(d);
      default: onLassoPanUpdate(d);
    }
  }

  void onPanEnd(DragEndDetails d) {
    switch (selectedTool) {
      case EditorTool.crop:  onCropPanEnd(d);
      case EditorTool.brush: onDrawPanEnd(d);
      case EditorTool.shape: onShapePanEnd(d);
      default: onLassoPanEnd(d);
    }
  }

  // ── Image rendering ───────────────────────────────────────────────────────

  Future<void> _applyDrawing(List<DrawStroke> strokes) async {
    final currentBytes = currentDisplayBytes;
    if (currentBytes == null || strokes.isEmpty || isGenerating) return;

    isGenerating = true;
    update();
    try {
      final codec = await ui.instantiateImageCodec(currentBytes);
      final frame = await codec.getNextFrame();
      final image = frame.image;

      final imageW = image.width.toDouble();
      final imageH = image.height.toDouble();
      final scale = min(canvasSize.width / imageW, canvasSize.height / imageH);
      final offsetX = (canvasSize.width - imageW * scale) / 2;
      final offsetY = (canvasSize.height - imageH * scale) / 2;

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      canvas.drawImage(image, Offset.zero, Paint());

      // Separate layer so eraser BlendMode.clear only clears drawing strokes
      canvas.saveLayer(Rect.fromLTWH(0, 0, imageW, imageH), Paint());
      for (final stroke in strokes) {
        _renderStroke(canvas, stroke, scale, offsetX, offsetY);
      }
      canvas.restore();

      final picture = recorder.endRecording();
      final result = await picture.toImage(imageW.round(), imageH.round());
      final byteData = await result.toByteData(format: ui.ImageByteFormat.png);
      final resultBytes = byteData!.buffer.asUint8List();

      if (_currentIndex < 0) {
        imageBytes = resultBytes;
      } else {
        final id = _editHistory[_currentIndex].id;
        if (id != null) _cacheBytes(id, resultBytes);
      }

      selectedTool = null;
      update();
    } catch (_) {
      showCustomSnackBar('apply_edit_failed'.tr);
    } finally {
      isGenerating = false;
      update();
    }
  }

  void _renderStroke(Canvas canvas, DrawStroke stroke, double scale, double offsetX, double offsetY) {
    final pts = stroke.points
        .map((p) => Offset((p.dx - offsetX) / scale, (p.dy - offsetY) / scale))
        .toList();
    if (pts.length < 2) return;

    final path = _strokePath(pts);
    final sz = stroke.size / scale;

    switch (stroke.style) {
      case BrushStyle.basic:
        canvas.drawPath(path, Paint()
          ..color = stroke.color
          ..strokeWidth = sz
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..style = PaintingStyle.stroke);
      case BrushStyle.glow:
        canvas.drawPath(path, Paint()
          ..color = stroke.color.withValues(alpha: 0.2)
          ..strokeWidth = sz * 5
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..style = PaintingStyle.stroke
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, sz * 2.0));
        canvas.drawPath(path, Paint()
          ..color = stroke.color.withValues(alpha: 0.5)
          ..strokeWidth = sz * 2
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..style = PaintingStyle.stroke
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, sz * 0.6));
        canvas.drawPath(path, Paint()
          ..color = stroke.color
          ..strokeWidth = sz * 0.5
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..style = PaintingStyle.stroke);
      case BrushStyle.highlighter:
        canvas.drawPath(path, Paint()
          ..color = stroke.color.withValues(alpha: 0.38)
          ..strokeWidth = sz * 3.5
          ..strokeCap = StrokeCap.square
          ..strokeJoin = StrokeJoin.bevel
          ..style = PaintingStyle.stroke);
      case BrushStyle.eraser:
        canvas.drawPath(path, Paint()
          ..color = Colors.transparent
          ..strokeWidth = sz * 2
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..style = PaintingStyle.stroke
          ..blendMode = BlendMode.clear);
    }
  }

  Path _strokePath(List<Offset> points) {
    final path = Path()..moveTo(points[0].dx, points[0].dy);
    if (points.length == 2) {
      path.lineTo(points[1].dx, points[1].dy);
      return path;
    }
    for (int i = 1; i < points.length - 1; i++) {
      final mid = Offset((points[i].dx + points[i + 1].dx) / 2, (points[i].dy + points[i + 1].dy) / 2);
      path.quadraticBezierTo(points[i].dx, points[i].dy, mid.dx, mid.dy);
    }
    path.lineTo(points.last.dx, points.last.dy);
    return path;
  }

  void showComingSoon(String feature) {
    showCustomSnackBar('feature_coming_soon'.trParams({'feature': feature}), isError: false);
  }
}
