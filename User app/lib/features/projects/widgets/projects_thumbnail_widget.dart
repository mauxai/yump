import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ProjectsThumbnailWidget extends StatelessWidget {
  final String? imagePath;
  final String? imageUrl;
  final BorderRadius borderRadius;
  final double iconSize;
  final BoxFit fit;
  final int? cacheWidth;
  final int? cacheHeight;

  const ProjectsThumbnailWidget({
    super.key,
    this.imagePath,
    this.imageUrl,
    required this.borderRadius,
    this.iconSize = 28,
    this.fit = BoxFit.cover,
    this.cacheWidth,
    this.cacheHeight,
  });

  @override
  Widget build(BuildContext context) {
    Widget image;

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      image = CachedNetworkImage(
        imageUrl: imageUrl!,
        fit: fit,
        memCacheWidth: cacheWidth,
        memCacheHeight: cacheHeight,
        placeholder: (_, __) => Container(color: Theme.of(context).cardColor),
        errorWidget: (_, __, ___) => _errorWidget(context),
      );
    } else if (imagePath != null && imagePath!.isNotEmpty) {
      image = Image.file(
        File(imagePath!),
        fit: fit,
        cacheWidth: cacheWidth,
        cacheHeight: cacheHeight,
        errorBuilder: (_, __, ___) => _errorWidget(context),
      );
    } else {
      image = _errorWidget(context);
    }

    return ClipRRect(borderRadius: borderRadius, child: image);
  }

  Widget _errorWidget(BuildContext context) => Container(
    color: Theme.of(context).cardColor,
    child: Icon(
      Icons.broken_image_outlined,
      color: Theme.of(context).colorScheme.onSurfaceVariant,
      size: iconSize,
    ),
  );
}
