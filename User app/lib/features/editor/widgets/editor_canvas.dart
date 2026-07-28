import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/util/enums.dart';
import 'package:lumen/features/editor/widgets/hold_to_compare_button.dart';
import 'package:lumen/features/editor/widgets/lasso_painter.dart';
import 'package:lumen/features/editor/widgets/editor_scan_overlay_widget.dart';
import 'crop_painter.dart';
import 'draw_painter.dart';
import 'lasso_area_chip.dart';
import 'crop_size_chip.dart';

class EditorCanvas extends StatefulWidget {
  final EditorController ctrl;

  const EditorCanvas({super.key, required this.ctrl});

  @override
  State<EditorCanvas> createState() => _EditorCanvasState();
}

class _EditorCanvasState extends State<EditorCanvas> with SingleTickerProviderStateMixin {
  late final TransformationController _zoomController;
  late final AnimationController _animController;
  Animation<Matrix4>? _zoomAnimation;
  TapDownDetails? _doubleTapDetails;
  Size _viewportSize = Size.zero;
  double _swipeOffset = 0.0;

  static const double _kSwipeThreshold = 90.0;

  @override
  void initState() {
    super.initState();
    _zoomController = TransformationController();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    )..addListener(() {
      _zoomController.value = _zoomAnimation!.value;
    });
  }

  @override
  void dispose() {
    _zoomController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _animateTo(Matrix4 target) {
    _animController.stop();
    _zoomAnimation = Matrix4Tween(
      begin: _zoomController.value,
      end: target,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeInOutCubic));
    _animController.forward(from: 0);
  }

  void _onDoubleTapDown(TapDownDetails d) => _doubleTapDetails = d;

  void _onDoubleTap() {
    final isZoomed = _zoomController.value.getMaxScaleOnAxis() > 1.05;
    if (isZoomed) {
      _animateTo(Matrix4.identity());
      return;
    }
    const scale = 2.5;
    final tap = _doubleTapDetails?.localPosition ?? Offset.zero;
    final tx = _viewportSize.width / 2 - tap.dx * scale;
    final ty = _viewportSize.height / 2 - tap.dy * scale;
    _animateTo(
      Matrix4.translationValues(tx, ty, 0) *
      Matrix4.diagonal3Values(scale, scale, 1),
    );
  }

  void _onInteractionStart(ScaleStartDetails _) {
    if (_swipeOffset != 0) setState(() => _swipeOffset = 0);
  }

  void _onInteractionUpdate(ScaleUpdateDetails details) {
    if (_zoomController.value.getMaxScaleOnAxis() > 1.05) return;
    if (widget.ctrl.selectedTool != null) return;
    if (widget.ctrl.isGenerating) return;
    if (details.pointerCount > 1) return;
    final dx = details.focalPointDelta.dx;
    if (dx > 0 && !widget.ctrl.canUndo) return;
    if (dx < 0 && !widget.ctrl.canRedo) return;
    setState(() {
      _swipeOffset = (_swipeOffset + dx).clamp(-_kSwipeThreshold * 1.3, _kSwipeThreshold * 1.3);
    });
  }

  void _onInteractionEnd(ScaleEndDetails _) {
    final ctrl = widget.ctrl;
    if (!ctrl.isGenerating) {
      if (_swipeOffset >= _kSwipeThreshold && ctrl.canUndo) {
        ctrl.undo();
      } else if (_swipeOffset <= -_kSwipeThreshold && ctrl.canRedo) {
        ctrl.redo();
      }
    }
    if (mounted) setState(() => _swipeOffset = 0);
  }

  double _lassoAreaPercent(List<Offset> points) {
    if (points.length < 3) return 0;
    double area = 0;
    for (int i = 0; i < points.length; i++) {
      final j = (i + 1) % points.length;
      area += points[i].dx * points[j].dy;
      area -= points[j].dx * points[i].dy;
    }
    return (area.abs() / 2 * 100).clamp(0, 100);
  }

  Widget _buildImage(BuildContext context, EditorController ctrl) {
    final bytes = ctrl.showOriginal
        ? (ctrl.originalImageBytes ?? ctrl.imageBytes)
        : ctrl.currentDisplayBytes;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: bytes != null
          ? Image.memory(bytes, key: ValueKey(ctrl.navigationStamp), fit: BoxFit.contain)
          : Container(
              key: const ValueKey('loading'),
              color: Theme.of(context).colorScheme.surface,
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.gradientEnd, strokeWidth: 2),
              ),
            ),
    );
  }

  Widget _buildSwipeOverlay(EditorController ctrl) {
    if (_swipeOffset.abs() < 8) return const SizedBox.shrink();
    final isRight = _swipeOffset > 0;
    if (!(isRight ? ctrl.canUndo : ctrl.canRedo)) return const SizedBox.shrink();

    final progress = (_swipeOffset.abs() / _kSwipeThreshold).clamp(0.0, 1.0);
    final isConfirmed = progress >= 1.0;
    final slideOffset = isRight ? -20.0 * (1 - progress) : 20.0 * (1 - progress);

    return Positioned(
      left: isRight ? 16 : null,
      right: isRight ? null : 16,
      top: 0,
      bottom: 0,
      child: IgnorePointer(
        child: Center(
          child: Opacity(
            opacity: progress,
            child: Transform.translate(
              offset: Offset(slideOffset, 0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 100),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                decoration: BoxDecoration(
                  color: isConfirmed
                      ? AppColors.gradientEnd.withValues(alpha: 0.9)
                      : Colors.black.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: isConfirmed ? AppColors.gradientEnd : Colors.white30,
                    width: 1.5,
                  ),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 8)],
                ),
                child: Icon(
                  isRight ? Icons.arrow_back_ios_new_rounded : Icons.arrow_forward_ios_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: LayoutBuilder(
        builder: (context, constraints) {
          _viewportSize = Size(constraints.maxWidth, constraints.maxHeight);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.ctrl.setCanvasSize(_viewportSize);
          });

          return ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: GetBuilder<EditorController>(builder: (ctrl) {
              final isToolActive = ctrl.selectedTool != null;
              final areaPercent = _lassoAreaPercent(ctrl.lassoPoints);

              return Stack(
                fit: StackFit.expand,
                children: [
                  InteractiveViewer(
                    transformationController: _zoomController,
                    panEnabled: !isToolActive,
                    scaleEnabled: !isToolActive,
                    minScale: 1.0,
                    maxScale: 8.0,
                    onInteractionStart: _onInteractionStart,
                    onInteractionUpdate: _onInteractionUpdate,
                    onInteractionEnd: _onInteractionEnd,
                    child: GestureDetector(
                      onDoubleTapDown: isToolActive ? null : _onDoubleTapDown,
                      onDoubleTap: isToolActive ? null : _onDoubleTap,
                      onPanStart: isToolActive ? ctrl.onPanStart : null,
                      onPanUpdate: isToolActive ? ctrl.onPanUpdate : null,
                      onPanEnd: isToolActive ? ctrl.onPanEnd : null,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          _buildImage(context, ctrl),

                          if (ctrl.lassoPoints.isNotEmpty)
                            IgnorePointer(
                              child: CustomPaint(
                                painter: LassoPainter(
                                  points: ctrl.lassoPoints,
                                  closed: ctrl.lassoClosed,
                                  imageRect: ctrl.currentImageRect,
                                ),
                              ),
                            ),

                          if (ctrl.lassoClosed)
                            Positioned(
                              top: 14,
                              left: 14,
                              child: LassoAreaChip(areaPercent: areaPercent),
                            ),

                          if (ctrl.cropRect != null)
                            IgnorePointer(
                              child: CustomPaint(
                                painter: CropPainter(cropRect: ctrl.cropRect!, showGrid: ctrl.showCropGrid),
                              ),
                            ),

                          if (ctrl.cropRect != null)
                            Positioned(
                              top: 14,
                              left: 14,
                              child: CropSizeChip(cropRect: ctrl.cropRect!, imageRect: ctrl.currentImageRect),
                            ),

                          if (ctrl.drawStrokes.isNotEmpty || ctrl.currentDrawStroke != null)
                            IgnorePointer(
                              child: CustomPaint(
                                painter: DrawPainter(strokes: ctrl.drawStrokes, currentStroke: ctrl.currentDrawStroke),
                              ),
                            ),

                          if (ctrl.isGenerating) const EditorScanOverlay(),
                        ],
                      ),
                    ),
                  ),

                  _buildSwipeOverlay(ctrl),

                  if (ctrl.currentIndex >= 0 && ctrl.selectedTool != EditorTool.crop)
                    Positioned(
                      bottom: 14,
                      right: 14,
                      child: HoldToCompareButton(
                        onHoldStart: () => ctrl.setShowOriginal(true),
                        onHoldEnd: () => ctrl.setShowOriginal(false),
                      ),
                    ),
                ],
              );
            }),
          );
        },
      ),
    );
  }
}
