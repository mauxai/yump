import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/features/home/widgets/home_section_header_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:photo_manager/photo_manager.dart';

class HomeGallerySection extends GetView<HomeController> {
  const HomeGallerySection({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<HomeController>(builder: (controller) {
      if (!controller.hasGalleryPermission ||
          controller.galleryImages.isEmpty) {
        return const SizedBox.shrink();
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Dimensions.fontSizeOverLarge),
          HomeSectionHeaderWidget(title: 'gallery'.tr),
          const SizedBox(height: Dimensions.fontSizeSmall),
          LayoutBuilder(
            builder: (context, constraints) {
              final isTablet = constraints.maxWidth >= 600;
              final maxItems = isTablet ? 20 : 12;
              final crossAxisCount = isTablet ? 5 : 3;
              final display = controller.galleryImages.take(maxItems).toList();

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1,
                ),
                itemCount: display.length,
                itemBuilder: (_, index) => _GalleryItem(asset: display[index]),
              );
            },
          ),
        ],
      );
    });
  }
}

class _GalleryItem extends GetView<HomeController> {
  final AssetEntity asset;

  const _GalleryItem({required this.asset});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final crossAxisCount = mq.size.width >= 600 ? 5.0 : 3.0;
    final cellPx = ((mq.size.width - Dimensions.paddingSizeLarge * 2 - 10.0 * (crossAxisCount - 1)) / crossAxisCount * mq.devicePixelRatio).round();
    // Source thumbnail is capped at 200 px; clamp so we never ask Flutter to upsample.
    final cacheSize = cellPx.clamp(1, 200);

    return GestureDetector(
      onTap: () => controller.openGalleryAsset(asset),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Dimensions.fontSizeSmall),
        child: FutureBuilder<Uint8List?>(
          future: asset.thumbnailDataWithSize(const ThumbnailSize.square(200)),
          builder: (_, snapshot) {
            if (snapshot.hasData && snapshot.data != null) {
              return Image.memory(snapshot.data!, fit: BoxFit.cover, cacheWidth: cacheSize);
            }

            if (snapshot.connectionState == ConnectionState.done) {
              return Container(
                color: Theme.of(context).cardColor,
                child: Icon(
                  Icons.broken_image_outlined,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  size:
                      Dimensions.fontSizeOverLarge + Dimensions.radiusSmall - 1,
                ),
              );
            }

            return Container(color: Theme.of(context).cardColor);
          },
        ),
      ),
    );
  }
}
