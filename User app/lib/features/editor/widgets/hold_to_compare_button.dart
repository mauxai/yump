import 'package:flutter/material.dart';
import 'package:lumen/util/styles.dart';

class HoldToCompareButton extends StatefulWidget {
  const HoldToCompareButton({
    super.key,
    required this.onHoldStart,
    required this.onHoldEnd,
  });

  final VoidCallback onHoldStart;
  final VoidCallback onHoldEnd;

  @override
  State<HoldToCompareButton> createState() => _HoldToCompareButtonState();
}

class _HoldToCompareButtonState extends State<HoldToCompareButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPressStart: (_) {
        setState(() => _pressed = true);
        widget.onHoldStart();
      },
      onLongPressEnd: (_) {
        setState(() => _pressed = false);
        widget.onHoldEnd();
      },
      onLongPressCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.90 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.72),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wb_sunny_outlined, color: Colors.white, size: 14),
              const SizedBox(width: 6),
              Text(
                'Hold to compare',
                style: robotoMedium.copyWith(
                  color: Colors.white,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
