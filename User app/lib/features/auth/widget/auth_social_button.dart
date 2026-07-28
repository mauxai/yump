import 'package:flutter/material.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class AuthSocialButton extends StatefulWidget {
  final Widget icon;
  final String label;
  final VoidCallback? onTap;
  final bool isLoading;

  const AuthSocialButton({super.key, required this.icon, required this.label, this.onTap, this.isLoading = false});

  @override
  State<AuthSocialButton> createState() => _AuthSocialButtonState();
}

class _AuthSocialButtonState extends State<AuthSocialButton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          border: Border.all(color: colorScheme.outline),
        ),
        child: Center(
          child: widget.isLoading
              ? Row(mainAxisSize: MainAxisSize.min, children: [
                  BounceDot(controller: _controller, delay: 0.0, color: colorScheme.onSurface),
                  const SizedBox(width: 7),
                  BounceDot(controller: _controller, delay: 0.2, color: colorScheme.onSurface),
                  const SizedBox(width: 7),
                  BounceDot(controller: _controller, delay: 0.4, color: colorScheme.onSurface),
                ])
              : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  widget.icon,
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  Text(widget.label, style: robotoMedium.copyWith(color: colorScheme.onSurface, fontSize: Dimensions.fontSizeDefault)),
                ]),
        ),
      ),
    );
  }
}
