import 'package:flutter/material.dart';
import 'package:lumen/util/dimensions.dart';

class ProjectsShimmerWidget extends StatefulWidget {
  const ProjectsShimmerWidget({super.key});

  @override
  State<ProjectsShimmerWidget> createState() => _ProjectsShimmerWidgetState();
}

class _ProjectsShimmerWidgetState extends State<ProjectsShimmerWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  late final Animation<double> _anim = Tween<double>(begin: -2, end: 2).animate(_ctrl);

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Widget _box(double height, {double? width, double radius = 8}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE0E0E0);
    final highlight = isDark ? const Color(0xFF48484A) : const Color(0xFFF5F5F5);

    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(radius),
          gradient: LinearGradient(
            begin: Alignment(_anim.value - 1, 0),
            end: Alignment(_anim.value, 0),
            colors: [base, highlight, base],
          ),
        ),
      ),
    );
  }

  Widget _shimmerListItem() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF2F2F7);

    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        _box(76, width: 76, radius: 13),

        const SizedBox(width: 14),

        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _box(13, width: 140, radius: 5),
              const SizedBox(height: 8),
              _box(11, width: 88, radius: 5),
            ],
          ),
        ),

        const SizedBox(width: 14),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
      itemCount: 8,
      separatorBuilder: (_, __) => const SizedBox(height: Dimensions.paddingSizeSmall),
      itemBuilder: (_, __) => _shimmerListItem(),
    );
  }
}
