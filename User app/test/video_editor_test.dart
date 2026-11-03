import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/features/video_studio/repo/video_editor_repo.dart';
import 'package:lumen/features/video_studio/widgets/video_inline_preview_widget.dart';

class MockVideoEditorRepo extends Fake implements VideoEditorRepo {
  String? lastUploadedMediaType;
  String? lastUploadedFilePath;

  @override
  Future<Response> fetchVideoEditGallery({int page = 1, int limit = 20}) async {
    return const Response(statusCode: 200, body: {'items': []});
  }

  @override
  Future<Response> uploadMedia({required String filePath, required String mediaType}) async {
    lastUploadedFilePath = filePath;
    lastUploadedMediaType = mediaType;
    return const Response(statusCode: 200, body: {'url': 'https://example.com/uploaded.png'});
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('VideoEditor Models Tests', () {
    test('TimelineClipModel serialization and copyWith', () {
      final clip = TimelineClipModel(
        id: 'c1',
        videoUrl: 'https://example.com/sample.mp4',
        length: 8,
        trim: 2,
        speed: 1.5,
        fit: 'contain',
        transitionIn: 'fade',
        transitionOut: 'slideLeft',
        effect: 'zoomIn',
      );

      final json = clip.toJson();
      expect(json['id'], 'c1');
      expect(json['length'], 8);
      expect(json['speed'], 1.5);
      expect(json['fit'], 'contain');
      expect(json['transitionOut'], 'slideLeft');
      expect(json['effect'], 'zoomIn');

      final deserialized = TimelineClipModel.fromJson(json);
      expect(deserialized.id, 'c1');
      expect(deserialized.speed, 1.5);
      expect(deserialized.fit, 'contain');

      final copied = clip.copyWith(length: 12, speed: 2.0);
      expect(copied.length, 12);
      expect(copied.speed, 2.0);
      expect(copied.videoUrl, clip.videoUrl);
    });

    test('TextOverlayModel serialization', () {
      final overlay = TextOverlayModel(
        id: 't1',
        text: 'Assam Tourism',
        position: 'topRight',
        size: 'large',
        color: '#facc15',
        background: '#000000cc',
        start: 1,
        length: 5,
      );

      final json = overlay.toJson();
      expect(json['text'], 'Assam Tourism');
      expect(json['position'], 'topRight');
      expect(json['size'], 'large');
      expect(json['background'], '#000000cc');

      final deserialized = TextOverlayModel.fromJson(json);
      expect(deserialized.text, 'Assam Tourism');
      expect(deserialized.size, 'large');
      expect(deserialized.background, '#000000cc');
    });

    test('WatermarkModel serialization', () {
      final watermark = WatermarkModel(
        url: 'https://example.com/logo.png',
        position: 'bottomRight',
        opacity: 0.9,
        scale: 0.2,
      );

      final json = watermark.toJson();
      expect(json['position'], 'bottomRight');
      expect(json['opacity'], 0.9);
      expect(json['scale'], 0.2);

      final deserialized = WatermarkModel.fromJson(json);
      expect(deserialized.url, watermark.url);
      expect(deserialized.opacity, 0.9);
    });
  });

  group('VideoEditorController Timeline Operations', () {
    late VideoEditorController controller;

    setUp(() {
      Get.testMode = true;
      controller = VideoEditorController(videoEditorRepo: MockVideoEditorRepo());
    });

    tearDown(() {
      Get.reset();
    });

    test('Add and manage clips', () {
      controller.addClip('https://example.com/clip1.mp4', length: 10);
      expect(controller.clips.length, 1);
      expect(controller.clips.first.length, 10);

      controller.addClip('https://example.com/clip2.mp4', length: 6);
      expect(controller.clips.length, 2);
      expect(controller.selectedClipIndex, 1);

      controller.reorderClips(1, 0);
      expect(controller.clips.first.videoUrl, 'https://example.com/clip2.mp4');
    });

    test('Split clip into two parts', () {
      controller.addClip('https://example.com/clip1.mp4', length: 10);
      expect(controller.clips.length, 1);

      controller.splitClip(0, 4.0);
      expect(controller.clips.length, 2);
      expect(controller.clips[0].length, 4);
      expect(controller.clips[1].length, 6);
      expect(controller.clips[1].trim, 4);
    });

    test('Duplicate clip', () {
      controller.addClip('https://example.com/clip1.mp4', length: 7);
      controller.duplicateClip(0);

      expect(controller.clips.length, 2);
      expect(controller.clips[0].videoUrl, controller.clips[1].videoUrl);
      expect(controller.clips[1].length, 7);
    });

    test('Watermark & Export settings', () {
      controller.setWatermark(url: 'https://example.com/logo.png', position: 'topLeft', opacity: 0.8, scale: 0.15);
      expect(controller.watermark, isNotNull);
      expect(controller.watermark!.position, 'topLeft');

      controller.setResolution('1080');
      expect(controller.selectedResolution, '1080');

      controller.setFormat('gif');
      expect(controller.selectedFormat, 'gif');

      controller.removeWatermark();
      expect(controller.watermark, isNull);
    });

    test('Multi-Track Timeline Zoom and Global Seek', () {
      expect(controller.timelineZoom, 24.0);
      controller.zoomIn();
      expect(controller.timelineZoom, 30.0);
      controller.zoomOut();
      expect(controller.timelineZoom, 24.0);

      controller.addClip('https://example.com/clip1.mp4', length: 10);
      controller.addClip('https://example.com/clip2.mp4', length: 15);
      expect(controller.totalTimelineDuration, 25.0);

      controller.seekGlobalTimeline(14.0);
      expect(controller.selectedClipIndex, 1);
    });

    test('VideoEditRecordModel status getters', () {
      final completedRecord = VideoEditRecordModel(
        id: 'rec_1',
        title: 'Bihu Festival Highlights',
        status: 'COMPLETED',
        videoUrl: 'https://example.com/bihu.mp4',
        aspectRatio: '16:9',
        resolution: '1080p',
        creditCost: 3,
        createdAt: DateTime.now(),
      );
      expect(completedRecord.isCompleted, isTrue);
      expect(completedRecord.isProcessing, isFalse);
      expect(completedRecord.isFailed, isFalse);

      final processingRecord = VideoEditRecordModel(
        id: 'rec_2',
        title: 'Kaziranga Tour',
        status: 'PROCESSING',
        aspectRatio: '9:16',
        resolution: '720p',
        creditCost: 3,
        createdAt: DateTime.now(),
      );
      expect(processingRecord.isProcessing, isTrue);
      expect(processingRecord.isCompleted, isFalse);

      final failedRecord = VideoEditRecordModel(
        id: 'rec_3',
        title: 'Failed Project',
        status: 'FAILED',
        errorMessage: 'Encoding timeout',
        aspectRatio: '1:1',
        resolution: '720p',
        creditCost: 3,
        createdAt: DateTime.now(),
      );
      expect(failedRecord.isFailed, isTrue);
    });

    test('Render stage tracking and restoration for editing', () {
      expect(controller.activeRenderStage, 1);
      expect(controller.isDownloading, isFalse);
      expect(controller.isSharing, isFalse);

      // Pre-populate clips to verify timeline preservation
      controller.addClip('https://example.com/existing_clip.mp4', length: 12);
      expect(controller.clips.length, 1);

      final record = VideoEditRecordModel(
        id: 'rec_restored',
        title: 'Preserved Project Edit',
        status: 'COMPLETED',
        videoUrl: 'https://example.com/rendered.mp4',
        aspectRatio: '9:16',
        resolution: '4k',
        creditCost: 3,
        createdAt: DateTime.now(),
      );

      // Restoring with existing clips preserves timeline clips and sets settings
      controller.restoreProjectForEditing(record);
      expect(controller.clips.length, 1);
      expect(controller.clips.first.videoUrl, 'https://example.com/existing_clip.mp4');
      expect(controller.title, 'Preserved Project Edit');
      expect(controller.selectedAspectRatio, '9:16');
      expect(controller.selectedResolution, '4k');

      // Test restoration when clips are empty
      controller.clips.clear();
      controller.restoreProjectForEditing(record);
      expect(controller.clips.length, 1);
      expect(controller.clips.first.videoUrl, 'https://example.com/rendered.mp4');
    });

    test('VideoColorFilterHelper matrix calibrations and null fallback', () {
      expect(VideoColorFilterHelper.getFilter('sepia'), isNotNull);
      expect(VideoColorFilterHelper.getFilter('greyscale'), isNotNull);
      expect(VideoColorFilterHelper.getFilter('boost'), isNotNull);
      expect(VideoColorFilterHelper.getFilter('contrast'), isNotNull);
      expect(VideoColorFilterHelper.getFilter('darken'), isNotNull);
      expect(VideoColorFilterHelper.getFilter('lighten'), isNotNull);
      expect(VideoColorFilterHelper.getFilter('none'), isNull);
      expect(VideoColorFilterHelper.getFilter(null), isNull);

      // Verify mathematical dimension (4x5 = 20 entries)
      expect(VideoColorFilterHelper.sepiaMatrix.length, 20);
      expect(VideoColorFilterHelper.greyscaleMatrix.length, 20);
      expect(VideoColorFilterHelper.boostMatrix.length, 20);
      expect(VideoColorFilterHelper.contrastMatrix.length, 20);
      expect(VideoColorFilterHelper.darkenMatrix.length, 20);
      expect(VideoColorFilterHelper.lightenMatrix.length, 20);
    });

    test('Virtual trim duration, progress, and A/B ping-pong slot', () {
      expect(controller.activePlayerSlot, 0);
      expect(controller.isLoopSeeking, isFalse);

      controller.addClip('https://example.com/test_video.mp4', length: 6);
      expect(controller.virtualClipDuration, const Duration(seconds: 6));
      expect(controller.normalizedClipProgress, 0.0);

      // Verify pre-emptive threshold calculation: (trim + length) - 40ms
      final trimMs = controller.clips.first.trim * 1000;
      final lengthMs = controller.clips.first.length * 1000;
      final thresholdMs = (trimMs + lengthMs) - 40;
      expect(thresholdMs, 5960);
    });

    test('CapCut Feature: Undo and Redo operations', () {
      expect(controller.canUndo, isFalse);
      expect(controller.canRedo, isFalse);

      controller.addClip('https://example.com/undo1.mp4', length: 5.0);
      expect(controller.clips.length, 1);
      expect(controller.canUndo, isTrue);

      controller.addClip('https://example.com/undo2.mp4', length: 4.0);
      expect(controller.clips.length, 2);

      controller.undo();
      expect(controller.clips.length, 1);
      expect(controller.clips.first.videoUrl, 'https://example.com/undo1.mp4');
      expect(controller.canRedo, isTrue);

      controller.redo();
      expect(controller.clips.length, 2);
      expect(controller.clips[1].videoUrl, 'https://example.com/undo2.mp4');
    });

    test('CapCut Feature: Sub-second precision splitting and trimming', () {
      controller.addClip('https://example.com/precise.mp4', length: 8.5);
      expect(controller.clips.first.length, 8.5);

      controller.splitClip(0, 3.25);
      expect(controller.clips.length, 2);
      expect(controller.clips[0].length, 3.25);
      expect(controller.clips[1].length, 5.25);
      expect(controller.clips[1].trim, 3.25);
      expect(controller.clips[1].transitionIn, isNull); // Verified: no forced fade!

      controller.updateClipTrimRange(0, 0.5, 2.75);
      expect(controller.clips[0].trim, 0.5);
      expect(controller.clips[0].length, 2.75);
    });

    test('CapCut Feature: LocalPath zero-upload support', () {
      final clip = TimelineClipModel(
        id: 'local_1',
        videoUrl: '/path/to/local.mp4',
        localPath: '/path/to/local.mp4',
        length: 6.2,
      );
      expect(clip.localPath, '/path/to/local.mp4');
      final json = clip.toJson();
      expect(json['localPath'], '/path/to/local.mp4');
      final deserialized = TimelineClipModel.fromJson(json);
      expect(deserialized.localPath, '/path/to/local.mp4');
      expect(deserialized.length, 6.2);
    });

    test('CapCut Feature: Auto-detect aspect ratio and resolution quality', () {
      // Portrait video (e.g. 1080x1920) -> 9:16 and 1080
      controller.autoDetectAspectAndQuality(1080, 1920);
      expect(controller.selectedAspectRatio, '9:16');
      expect(controller.selectedResolution, '1080');

      // Landscape video (e.g. 1280x720) -> 16:9 and hd
      controller.autoDetectAspectAndQuality(1280, 720);
      expect(controller.selectedAspectRatio, '16:9');
      expect(controller.selectedResolution, 'hd');

      // Square video (e.g. 1000x1000) -> 1:1 and hd
      controller.autoDetectAspectAndQuality(1000, 1000);
      expect(controller.selectedAspectRatio, '1:1');
      expect(controller.selectedResolution, 'hd');

      // 4:5 Instagram feed ratio (e.g. 800x1000) -> 4:5 and hd
      controller.autoDetectAspectAndQuality(800, 1000);
      expect(controller.selectedAspectRatio, '4:5');

      // 4:3 video (e.g. 640x480) -> 4:3 and sd
      controller.autoDetectAspectAndQuality(640, 480);
      expect(controller.selectedAspectRatio, '4:3');
      expect(controller.selectedResolution, 'sd');

      // Low resolution (e.g. 320x240) -> mobile
      controller.autoDetectAspectAndQuality(320, 240);
      expect(controller.selectedResolution, 'mobile');
    });

    test('CapCut Feature: Media upload detects image, audio, and video types', () async {
      final mockRepo = controller.videoEditorRepo as MockVideoEditorRepo;

      // Watermark image
      final imgUrl = await controller.uploadMediaFile('assets/logo.png', mediaType: 'image');
      expect(imgUrl, 'https://example.com/uploaded.png');
      expect(mockRepo.lastUploadedMediaType, 'image');

      // Auto-detect image from extension
      await controller.uploadMediaFile('pictures/watermark.jpg');
      expect(mockRepo.lastUploadedMediaType, 'image');

      // Audio file
      await controller.uploadMediaFile('music/soundtrack.mp3', isAudio: true);
      expect(mockRepo.lastUploadedMediaType, 'audio');

      // Video file
      await controller.uploadMediaFile('videos/clip.mp4');
      expect(mockRepo.lastUploadedMediaType, 'video');
    });

    test('CapCut Feature: Draft model serialization and draft management', () {
      final draft = VideoEditorDraftModel(
        id: 'draft_101',
        title: 'Summer Vacation',
        updatedAt: DateTime.now(),
        clips: [
          TimelineClipModel(id: 'c1', videoUrl: 'https://example.com/v1.mp4', length: 12.0),
          TimelineClipModel(id: 'c2', videoUrl: 'https://example.com/p1.jpg', length: 4.0, isImage: true),
        ],
        aspectRatio: '9:16',
        resolution: '1080',
      );

      final json = draft.toJson();
      expect(json['id'], 'draft_101');
      expect(json['title'], 'Summer Vacation');
      expect((json['clips'] as List).length, 2);

      final fromJson = VideoEditorDraftModel.fromJson(json);
      expect(fromJson.id, 'draft_101');
      expect(fromJson.title, 'Summer Vacation');
      expect(fromJson.clips.length, 2);
      expect(fromJson.clips[1].isImage, isTrue);

      // Load draft into controller
      controller.loadDraft(draft);
      expect(controller.title, 'Summer Vacation');
      expect(controller.clips.length, 2);
      expect(controller.selectedAspectRatio, '9:16');
      expect(controller.selectedResolution, '1080');

      // Reset editor clears everything for fresh project
      controller.resetEditor();
      expect(controller.clips.isEmpty, isTrue);
      expect(controller.title, 'My Video Edit');
    });

    test('CapCut Feature: Image clip plays on timeline without error', () {
      controller.addClip('https://example.com/slide.jpg', length: 4.0, isImage: true);
      expect(controller.clips.length, 1);
      expect(controller.clips.first.isImage, isTrue);
      expect(controller.isPlayerInitialized, isTrue);
      expect(controller.virtualClipDuration.inSeconds, 4);

      // Play image clip
      controller.togglePlayPause();
      expect(controller.isPlaying, isTrue);

      // Seek in image clip
      controller.seekToVirtual(const Duration(seconds: 2));
      expect(controller.virtualCurrentPosition.inSeconds, 2);

      // Pause image clip
      controller.togglePlayPause();
      expect(controller.isPlaying, isFalse);
    });
  });
}
