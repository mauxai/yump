import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../util/styles.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    required this.name,
    required this.photoUrl,
    required this.size,
    this.borderRadius,
  });

  final String name;
  final String photoUrl;
  final double size;
  final double? borderRadius;

  String get _initials {
    final words = name.trim().split(RegExp(r'\s+'));
    return words
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase())
        .take(2)
        .join();
  }

  double get _fontSize => size * 0.38;
  double get _radius => borderRadius ?? size * 0.27;

  Widget _initialsBox() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(_radius),
      ),
      child: Center(
        child: Text(
          _initials.isEmpty ? '?' : _initials,
          style: robotoBold.copyWith(
            color: Colors.white,
            fontSize: _fontSize,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (photoUrl.isEmpty) return _initialsBox();

    return ClipRRect(
      borderRadius: BorderRadius.circular(_radius),
      child: CachedNetworkImage(
        imageUrl: photoUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => _initialsBox(),
        errorWidget: (_, __, ___) => _initialsBox(),
      ),
    );
  }
}
