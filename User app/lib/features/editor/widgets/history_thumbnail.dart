import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/styles.dart';

class HistoryThumbnail extends StatelessWidget {
  const HistoryThumbnail({
    super.key,
    this.imageBytes,
    this.imageUrl,
    required this.label,
    required this.isSelected,
    required this.onTap,
  }) : assert(imageBytes != null || imageUrl != null, 'Provide imageBytes or imageUrl');

  final Uint8List? imageBytes;
  final String? imageUrl;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  Widget _buildImage() {
    if (imageBytes != null) {
      return Image.memory(
        imageBytes!,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        cacheWidth: 112,
        cacheHeight: 112,
      );
    }
    return Image.network(
      imageUrl!,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      cacheWidth: 112,
      cacheHeight: 112,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return const Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 1.5,
              color: AppColors.gradientEnd,
            ),
          ),
        );
      },
      errorBuilder: (_, __, ___) => const Center(
        child: Icon(Icons.broken_image_outlined, size: 20, color: Colors.white38),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 56,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              padding: EdgeInsets.all(isSelected ? 2 : 1),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [AppColors.gradientStart, AppColors.gradientEnd],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isSelected ? null : Theme.of(context).colorScheme.outline,
                borderRadius: BorderRadius.circular(10),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: _buildImage(),
              ),
            ),

            const SizedBox(height: 4),

            Text(
              label,
              style: (isSelected ? robotoMedium : robotoRegular).copyWith(
                color: isSelected
                    ? Theme.of(context).colorScheme.onSurface
                    : Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 10,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
