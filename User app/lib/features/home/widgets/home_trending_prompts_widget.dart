import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/features/home/widgets/home_section_header_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeTrendingPrompts extends StatelessWidget {
  final List<String> prompts;
  final bool isLoading;
  final ValueChanged<String> onPromptTap;

  const HomeTrendingPrompts({
    super.key,
    required this.prompts,
    required this.isLoading,
    required this.onPromptTap,
  });

  static const _chipColors = [
    Color(0xFFFF5B79),
    Color(0xFF8B5CF6),
    Color(0xFF06B6D4),
    Color(0xFF10B981),
    Color(0xFFF59E0B),
    Color(0xFFEC4899),
    Color(0xFF3B82F6),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HomeSectionHeaderWidget(title: 'trending_prompts'.tr),
        const SizedBox(height: Dimensions.fontSizeSmall),
        if (isLoading)
          _ShimmerChipRow()
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            child: Row(
              children: [
                ...List.generate(prompts.length, (i) {
                  final color = _chipColors[i % _chipColors.length];
                  final label = prompts[i];

                  return _TrendingPromptPill(
                    label: label,
                    accentColor: color,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onPromptTap(label);
                    },
                  );
                }),
                const SizedBox(width: Dimensions.paddingSizeSmall),
              ],
            ),
          ),
      ],
    );
  }
}

class _TrendingPromptPill extends StatefulWidget {
  final String label;
  final Color accentColor;
  final VoidCallback onTap;

  const _TrendingPromptPill({
    required this.label,
    required this.accentColor,
    required this.onTap,
  });

  @override
  State<_TrendingPromptPill> createState() => _TrendingPromptPillState();
}

class _TrendingPromptPillState extends State<_TrendingPromptPill> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.94 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141620) : Colors.white,
            borderRadius: BorderRadius.circular(Dimensions.radiusPill),
            border: Border.all(
              color: isDark ? const Color(0xFF26283B) : const Color(0xFFE5E7EB),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: widget.accentColor,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: widget.accentColor.withValues(alpha: 0.5),
                      blurRadius: 4,
                      spreadRadius: 0.5,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                widget.label,
                style: robotoMedium.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 12.5,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShimmerChipRow extends StatefulWidget {
  @override
  State<_ShimmerChipRow> createState() => _ShimmerChipRowState();
}

class _ShimmerChipRowState extends State<_ShimmerChipRow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  late final Animation<double> _anim =
      Tween<double>(begin: -2, end: 2).animate(_ctrl);

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        child: Row(
          children: List.generate(4, (i) {
            final widths = [130.0, 100.0, 150.0, 110.0];
            return Container(
              margin: const EdgeInsets.only(right: 8),
              width: widths[i % widths.length],
              height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(Dimensions.radiusPill),
                gradient: LinearGradient(
                  begin: Alignment(_anim.value - 1, 0),
                  end: Alignment(_anim.value + 1, 0),
                  colors: [
                    Theme.of(context).colorScheme.surface,
                    Theme.of(context).colorScheme.outline.withValues(alpha: 0.25),
                    Theme.of(context).colorScheme.surface,
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
