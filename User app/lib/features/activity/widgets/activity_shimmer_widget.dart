import 'package:flutter/material.dart';
import 'package:lumen/util/dimensions.dart';

class ActivityShimmerWidget extends StatefulWidget {
  const ActivityShimmerWidget({super.key});

  @override
  State<ActivityShimmerWidget> createState() => _ActivityShimmerWidgetState();
}

class _ActivityShimmerWidgetState extends State<ActivityShimmerWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 1400),
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

  Widget _statsRow() {
    return Row(children: [
      Expanded(child: _box(70, radius: Dimensions.radiusDefault)),
      const SizedBox(width: Dimensions.paddingSizeEight),
      Expanded(child: _box(70, radius: Dimensions.radiusDefault)),
      const SizedBox(width: Dimensions.paddingSizeEight),
      Expanded(child: _box(70, radius: Dimensions.radiusDefault)),
    ]);
  }

  Widget _itemRow() {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
      child: Row(children: [
        _box(52, width: 52, radius: Dimensions.radiusSmall + 3),
        const SizedBox(width: Dimensions.paddingSizeSmall),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _box(14, width: double.infinity, radius: 6),
            const SizedBox(height: 8),
            _box(11, width: 140, radius: 5),
          ]),
        ),
        const SizedBox(width: Dimensions.paddingSizeEight),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          _box(11, width: 44, radius: 5),
          const SizedBox(height: 6),
          _box(11, width: 56, radius: 5),
        ]),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _statsRow(),
      const SizedBox(height: Dimensions.paddingSizeDefault),
      _box(46, radius: Dimensions.radiusDefault),
      const SizedBox(height: Dimensions.paddingSizeLarge),
      _box(11, width: 60, radius: 5),
      const SizedBox(height: Dimensions.paddingSizeSmall),
      ...List.generate(4, (_) => Padding(
        padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeEight),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            color: Theme.of(context).cardColor,
          ),
          child: _itemRow(),
        ),
      )),
    ]);
  }
}
