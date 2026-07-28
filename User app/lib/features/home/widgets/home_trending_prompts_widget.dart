import 'package:flutter/material.dart';
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
    Colors.orange,
    Colors.blue,
    Colors.pink,
    Colors.green,
    Colors.purple,
    Colors.teal,
    Colors.red,
    Colors.indigo,
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
            child: Row(
              children: List.generate(prompts.length, (i) {
                final color = _chipColors[i % _chipColors.length];
                final label = prompts[i];

                return GestureDetector(
                  onTap: () => onPromptTap(label),
                  child: Container(
                    margin: const EdgeInsets.only(right: Dimensions.paddingSizeEight),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(Dimensions.paddingSizeLarge),
                      border: Border.all(color: Theme.of(context).colorScheme.outline),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 8, height: 8,
                        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                      ),

                      const SizedBox(width: 6),

                      Text(label, style: robotoRegular.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: 13,
                      )),
                    ]),
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }
}

class _ShimmerChipRow extends StatefulWidget {
  @override
  State<_ShimmerChipRow> createState() => _ShimmerChipRowState();
}

class _ShimmerChipRowState extends State<_ShimmerChipRow> with SingleTickerProviderStateMixin {
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

  Widget _chip(double width) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE0E0E0);
    final highlight = isDark ? const Color(0xFF48484A) : const Color(0xFFF5F5F5);

    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: width,
        height: 36,
        margin: const EdgeInsets.only(right: Dimensions.paddingSizeEight),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment(_anim.value - 1, 0),
            end: Alignment(_anim.value, 0),
            colors: [base, highlight, base],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: [
        _chip(108),
        _chip(128),
        _chip(96),
        _chip(118),
      ]),
    );
  }
}
