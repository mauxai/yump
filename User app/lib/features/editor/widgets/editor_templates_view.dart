import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/controller/template_model.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class EditorTemplatesView extends StatefulWidget {
  final ScrollController scrollController;
  final void Function(Templates template) onSelect;

  const EditorTemplatesView({super.key, required this.scrollController, required this.onSelect});

  @override
  State<EditorTemplatesView> createState() => _EditorTemplatesViewState();
}

class _CategoryEntry {
  final String id;
  final String name;
  final int count;

  const _CategoryEntry({required this.id, required this.name, required this.count});
}

class _EditorTemplatesViewState extends State<EditorTemplatesView> {
  static const String _allKey = '__all__';
  String _selectedCategoryId = _allKey;

  List<_CategoryEntry> _categories(List<Templates> templates) {
    final names = <String, String>{};
    final counts = <String, int>{};
    for (final t in templates) {
      final id = t.categoryId;
      if (id == null || id.isEmpty) continue;
      names.putIfAbsent(id, () => t.categoryName ?? id);
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return names.entries.map((e) => _CategoryEntry(id: e.key, name: e.value, count: counts[e.key] ?? 0)).toList();
  }

  List<Templates> _filtered(List<Templates> templates) {
    if (_selectedCategoryId == _allKey) return templates;
    return templates.where((t) => t.categoryId == _selectedCategoryId).toList();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<DashboardController>(builder: (dashCtrl) {
      final templates = dashCtrl.templates;
      if (templates.isEmpty) {
        return Center(
          child: Text('templates_empty'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        );
      }

      final categories = _categories(templates);
      final filtered = _filtered(templates);

      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(Dimensions.paddingSizeLarge, 0, Dimensions.paddingSizeLarge, Dimensions.paddingSizeSmall),
          child: Text(
            'template_sheet_hint'.tr,
            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall + 1, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ),

        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
            itemCount: categories.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: Dimensions.paddingSizeEight),
            itemBuilder: (ctx, i) {
              final isAll = i == 0;
              final id = isAll ? _allKey : categories[i - 1].id;
              final name = isAll ? 'all'.tr : categories[i - 1].name;
              final count = isAll ? templates.length : categories[i - 1].count;
              return _CategoryChip(
                label: '$name ($count)',
                selected: _selectedCategoryId == id,
                onTap: () => setState(() => _selectedCategoryId = id),
              );
            },
          ),
        ),

        const SizedBox(height: Dimensions.paddingSizeSmall),

        Expanded(
          child: GridView.builder(
            controller: widget.scrollController,
            padding: const EdgeInsets.fromLTRB(
              Dimensions.paddingSizeLarge, 4, Dimensions.paddingSizeLarge, 36,
            ),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: Dimensions.paddingSizeEight,
              mainAxisSpacing: Dimensions.paddingSizeEight,
              childAspectRatio: 1.4,
            ),
            itemCount: filtered.length,
            itemBuilder: (ctx, i) => _TemplateCard(
              template: filtered[i],
              onTap: () => widget.onSelect(filtered[i]),
            ),
          ),
        ),
      ]);
    });
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.gradientEnd : scheme.onSurface.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
          border: Border.all(color: selected ? AppColors.gradientEnd : scheme.outline),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: robotoMedium.copyWith(
            fontSize: Dimensions.fontSizeSmall,
            color: selected ? Colors.white : scheme.onSurface,
          ),
        ),
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  final Templates template;
  final VoidCallback onTap;

  const _TemplateCard({required this.template, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final url = template.imageUrl ?? '';
    final usageCount = template.usageCount ?? 0;

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        child: Stack(fit: StackFit.expand, children: [
          if (url.isNotEmpty)
            CachedNetworkImage(
              imageUrl: url,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(color: scheme.onSurface.withValues(alpha: 0.06)),
              errorWidget: (_, __, ___) => Container(
                color: scheme.onSurface.withValues(alpha: 0.06),
                child: Icon(Icons.broken_image_outlined, color: scheme.onSurfaceVariant, size: 28),
              ),
            )
          else
            Container(color: scheme.onSurface.withValues(alpha: 0.06)),

          if (usageCount > 0)
            Positioned(
              top: 6,
              right: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.45),
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.bolt_outlined, color: Colors.white, size: 14),

                  const SizedBox(width: 4),

                  Text(
                    '$usageCount',
                    style: robotoMedium.copyWith(color: Colors.white, fontSize: Dimensions.fontSizeExtraSmall),
                  ),
                ]),
              ),
            ),

          Positioned(
            left: 0, right: 0, bottom: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.6)],
                ),
              ),
              child: Text(
                template.title ?? '',
                style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Colors.white),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
