import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class OtpInputWidget extends StatefulWidget {
  final ValueChanged<String> onCompleted;
  final bool enabled;

  const OtpInputWidget({super.key, required this.onCompleted, this.enabled = true});

  @override
  State<OtpInputWidget> createState() => OtpInputWidgetState();
}

class OtpInputWidgetState extends State<OtpInputWidget> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  String get currentOtp => _controllers.map((c) => c.text).join();

  @override
  void initState() {
    super.initState();
    for (int i = 0; i < 6; i++) {
      final index = i;
      _focusNodes[i].onKeyEvent = (_, event) {
        if (event is KeyDownEvent &&
            event.logicalKey == LogicalKeyboardKey.backspace &&
            _controllers[index].text.isEmpty &&
            index > 0) {
          _focusNodes[index - 1].requestFocus();
          return KeyEventResult.handled;
        }
        return KeyEventResult.ignored;
      };
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) { c.dispose(); }
    for (final f in _focusNodes) { f.dispose(); }
    super.dispose();
  }

  void _onChanged(int index, String value) {
    if (value.length == 1 && index < 5) { _focusNodes[index + 1].requestFocus(); }
    if (value.isEmpty && index > 0) { _focusNodes[index - 1].requestFocus(); }
    final otp = currentOtp;
    if (otp.length == 6) { widget.onCompleted(otp); }
  }

  void clear() {
    for (final c in _controllers) { c.clear(); }
    _focusNodes[0].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(
        6,
        (i) => _OtpCell(
          controller: _controllers[i],
          focusNode: _focusNodes[i],
          enabled: widget.enabled,
          onChanged: (v) => _onChanged(i, v),
        ),
      ),
    );
  }
}

class _OtpCell extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool enabled;
  final ValueChanged<String> onChanged;

  const _OtpCell({
    required this.controller,
    required this.focusNode,
    required this.enabled,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SizedBox(
      width: 46,
      height: 56,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        enabled: enabled,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        onChanged: onChanged,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: robotoBold.copyWith(color: colorScheme.onSurface, fontSize: Dimensions.fontSizeLarge),
        decoration: InputDecoration(
          counterText: '',
          filled: true,
          fillColor: colorScheme.surface,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 3),
            borderSide: BorderSide(color: colorScheme.outline),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 3),
            borderSide: const BorderSide(color: AppColors.gradientStart, width: 2),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 3),
            borderSide: BorderSide(color: colorScheme.outline.withValues(alpha: 0.4)),
          ),
        ),
      ),
    );
  }
}
