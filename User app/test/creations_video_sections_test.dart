import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:lumen/features/creations/views/creations_view.dart';
import 'package:lumen/features/gallery/controllers/cloud_gallery_controller.dart';
import 'package:lumen/features/gallery/repo/cloud_gallery_repo.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/repo/projects_repo.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/controllers/video_studio_controller.dart';
import 'package:lumen/features/video_studio/repo/video_editor_repo.dart';
import 'package:lumen/features/video_studio/repo/video_studio_repo.dart';

class MockProjectsRepo extends Fake implements ProjectsRepo {
  @override
  Future<Response> getProjects({required int page, required int pageSize}) async {
    return const Response(statusCode: 200, body: {'projects': [], 'total': 0});
  }
}

class MockCloudGalleryRepo extends Fake implements CloudGalleryRepo {
  @override
  Future<Response> fetchGallery({int page = 1, int limit = 20, String? projectId}) async {
    return const Response(statusCode: 200, body: {'edits': []});
  }

  Future<Response> fetchProjectsList() async {
    return const Response(statusCode: 200, body: {'projects': []});
  }
}

class MockVideoStudioRepo extends Fake implements VideoStudioRepo {
  @override
  Future<Response> fetchVideoModels() async {
    return const Response(statusCode: 200, body: {'models': []});
  }

  @override
  Future<Response> fetchVideoGallery({int page = 1, int limit = 20}) async {
    return const Response(
      statusCode: 200,
      body: {
        'items': [
          {
            'id': 'gen_vid_1',
            'prompt': 'A drone shot over green hills',
            'aspectRatio': '16:9',
            'duration': 5,
            'status': 'COMPLETED',
            'videoUrl': 'https://example.com/video1.mp4',
            'creditCost': 5,
          }
        ]
      },
    );
  }
}

class MockVideoEditorRepo extends Fake implements VideoEditorRepo {
  @override
  Future<Response> fetchVideoEditGallery({int page = 1, int limit = 20}) async {
    return Response(
      statusCode: 200,
      body: {
        'items': [
          {
            'id': 'edit_vid_1',
            'title': 'My Vacation Highlight',
            'status': 'COMPLETED',
            'videoUrl': 'https://example.com/edit1.mp4',
            'aspectRatio': '16:9',
            'resolution': 'hd',
            'duration': 12.5,
            'creditCost': 3,
            'createdAt': DateTime.now().toIso8601String(),
          }
        ]
      },
    );
  }
}

class TestTranslations extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {
        'en_US': {
          'creations': 'Creations',
          'images': 'Images',
          'videos': 'Videos',
          'projects': 'Projects',
          'cloud_gallery': 'Cloud Gallery',
          'generated': 'Generated',
          'edited': 'Edited',
          'no_videos_yet': 'No videos yet',
          'no_edits_yet': 'No edited videos yet',
          'edit_in_video_editor': 'Edit in Video Editor',
          'edit_video': 'Edit Video',
          'share_video': 'Share Video',
          'download_video': 'Save to Gallery',
          'delete': 'Delete',
        }
      };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    Get.reset();
    Get.put<ProjectsController>(ProjectsController(projectsRepo: MockProjectsRepo()));
    Get.put<CloudGalleryController>(CloudGalleryController(repo: MockCloudGalleryRepo()));
    Get.put<VideoStudioController>(VideoStudioController(repo: MockVideoStudioRepo()));
    Get.put<VideoEditorController>(VideoEditorController(videoEditorRepo: MockVideoEditorRepo()));
  });

  tearDown(() {
    Get.reset();
  });

  testWidgets('CreationsView renders Videos tab with Generated and Edited sections', (tester) async {
    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(
      GetMaterialApp(
        locale: const Locale('en', 'US'),
        translations: TestTranslations(),
        home: const CreationsView(),
      ),
    );
    await tester.pumpAndSettle();

    // Verify TabBar with Images and Videos
    expect(find.text('Images'), findsOneWidget);
    expect(find.text('Videos'), findsOneWidget);

    // Switch to Videos tab
    await tester.tap(find.text('Videos'));
    await tester.pumpAndSettle();

    // Verify two sub-sections exist: "Generated" and "Edited" ChoiceChips
    final generatedChip = find.widgetWithText(ChoiceChip, 'Generated');
    final editedChip = find.widgetWithText(ChoiceChip, 'Edited');
    expect(generatedChip, findsOneWidget);
    expect(editedChip, findsOneWidget);

    // By default, "Generated" is selected
    final ChoiceChip genWidget = tester.widget(generatedChip);
    expect(genWidget.selected, isTrue);

    final ChoiceChip editWidget = tester.widget(editedChip);
    expect(editWidget.selected, isFalse);

    // Verify generated video item is displayed
    expect(find.text('A drone shot over green hills'), findsOneWidget);

    // Tap "Edited" sub-section
    await tester.tap(editedChip);
    await tester.pumpAndSettle();

    // Verify "Edited" is now selected
    final ChoiceChip editWidgetSelected = tester.widget(find.widgetWithText(ChoiceChip, 'Edited'));
    expect(editWidgetSelected.selected, isTrue);

    final ChoiceChip genWidgetUnselected = tester.widget(find.widgetWithText(ChoiceChip, 'Generated'));
    expect(genWidgetUnselected.selected, isFalse);

    // Verify edited video item is displayed
    expect(find.text('My Vacation Highlight'), findsOneWidget);
    expect(find.textContaining('16:9 • hd • 12.5s • COMPLETED'), findsOneWidget);

    // Tap back to "Generated"
    await tester.tap(find.widgetWithText(ChoiceChip, 'Generated'));
    await tester.pumpAndSettle();

    expect(find.text('A drone shot over green hills'), findsOneWidget);
  });
}
