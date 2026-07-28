import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../util/styles.dart';

class CropSizeChip extends StatelessWidget {
  const CropSizeChip({
    super.key,
    required this.cropRect,
    required this.imageRect,
  });

  final Rect cropRect;
  final Rect imageRect;

  @override
  Widget build(BuildContext context) {
    final wPct = imageRect.width > 0 ? (cropRect.width / imageRect.width * 100).round() : 0;
    final hPct = imageRect.height > 0 ? (cropRect.height / imageRect.height * 100).round() : 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(20),
      ),
      child: ShaderMask(
        shaderCallback: (bounds) => const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
        ).createShader(bounds),
        child: Text(
          'CROP · $wPct% × $hPct%',
          style: robotoBold.copyWith(
            color: Colors.white,
            fontSize: 11,
            letterSpacing: 1.1,
          ),
        ),
      ),
    );
  }
}
