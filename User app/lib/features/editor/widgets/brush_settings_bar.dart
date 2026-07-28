import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_colors.dart';
import '../../../util/enums.dart';
import '../../../util/styles.dart';
import '../controllers/editor_controller.dart';

class BrushSettingsBar extends StatelessWidget {
  final EditorController ctrl;

  const BrushSettingsBar({super.key, required this.ctrl});

  static const _palette = [
    Colors.white,
    Color(0xFFFF3B30), Color(0xFFFF9500), Color(0xFFFFCC00),
    Color(0xFF34C759), Color(0xFF00C7BE), Color(0xFF007AFF),
    Color(0xFF5856D6), Color(0xFFFF2D55), Color(0xFFFF6B7A),
    Colors.black,
  ];

  static const _styles = [
    (BrushStyle.basic, Icons.brush_rounded, 'brush_style_basic'),
    (BrushStyle.glow, Icons.flare_rounded, 'brush_style_glow'),
    (BrushStyle.highlighter, Icons.format_color_fill, 'brush_style_highlight'),
    (BrushStyle.eraser, Icons.auto_fix_off_rounded, 'brush_style_eraser'),
  ];

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(builder: (ctrl) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outline)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _StyleRow(selected: ctrl.brushStyle, styles: _styles, onChanged: ctrl.setBrushStyle),
            const SizedBox(height: 10),
            _ColorRow(selected: ctrl.brushColor, palette: _palette, onChanged: ctrl.setBrushColor),
            const SizedBox(height: 8),
            _SizeRow(size: ctrl.brushSize, color: ctrl.brushColor, onChanged: ctrl.setBrushSize),
          ],
        ),
      );
    });
  }
}

class _StyleRow extends StatelessWidget {
  final BrushStyle selected;
  final List<(BrushStyle, IconData, String)> styles;
  final ValueChanged<BrushStyle> onChanged;

  const _StyleRow({required this.selected, required this.styles, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: styles.map((entry) {
        final (style, icon, label) = entry;
        final isSelected = selected == style;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(style),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [AppColors.gradientStart, AppColors.gradientEnd],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      )
                    : null,
                color: isSelected ? null : Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: isSelected ? null : Border.all(color: Theme.of(context).colorScheme.outline),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 18,
                      color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(height: 3),
                  Text(label.tr,
                      style: (isSelected ? robotoMedium : robotoRegular).copyWith(
                        fontSize: 10,
                        color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant,
                      )),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _ColorRow extends StatelessWidget {
  final Color selected;
  final List<Color> palette;
  final ValueChanged<Color> onChanged;

  const _ColorRow({required this.selected, required this.palette, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: palette.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final color = palette[i];
          final isSelected = selected.toARGB32() == color.toARGB32();
          return GestureDetector(
            onTap: () => onChanged(color),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.outline,
                  width: isSelected ? 2.5 : 1.5,
                ),
                boxShadow: isSelected
                    ? [BoxShadow(color: color.withValues(alpha: 0.6), blurRadius: 6, spreadRadius: 1)]
                    : null,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SizeRow extends StatelessWidget {
  final double size;
  final Color color;
  final ValueChanged<double> onChanged;

  const _SizeRow({required this.size, required this.color, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.remove_rounded, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
        Expanded(
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: AppColors.gradientEnd,
              inactiveTrackColor: Theme.of(context).colorScheme.outline,
              thumbColor: Colors.white,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
              overlayShape: SliderComponentShape.noOverlay,
              trackHeight: 3,
            ),
            child: Slider(value: size, min: 2, max: 40, onChanged: onChanged),
          ),
        ),
        Icon(Icons.add_rounded, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(width: 4),
        SizedBox(
          width: 28,
          child: Text(
            size.round().toString(),
            textAlign: TextAlign.right,
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
