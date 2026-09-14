import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:lumen/common/controller/ai_effect_model.dart';
import 'package:lumen/common/controller/ai_response_model.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/common/controller/voice_input_controller.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/common/widgets/voice_input_button_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/editor/widgets/editor_templates_view.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';
import '../controllers/editor_controller.dart';

IconData _mapLucideIcon(String? name) {
  switch (name?.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')) {
    case 'sun':                return LucideIcons.sun;
    case 'sun_dim':            return LucideIcons.sunDim;
    case 'sunset':             return LucideIcons.sunset;
    case 'sparkles':           return LucideIcons.sparkles;
    case 'sparkle':            return LucideIcons.sparkle;
    case 'zoom_in':            return LucideIcons.zoomIn;
    case 'sliders':
    case 'sliders_horizontal': return LucideIcons.slidersHorizontal;
    case 'image':              return LucideIcons.image;
    case 'layers':             return LucideIcons.layers;
    case 'scissors':           return LucideIcons.scissors;
    case 'film':               return LucideIcons.film;
    case 'pen':                return LucideIcons.pen;
    case 'pen_nib':
    case 'nib':                return LucideIcons.penLine;
    case 'droplet':            return LucideIcons.droplet;
    case 'paintbrush':
    case 'brush':              return LucideIcons.paintbrush;
    case 'pencil':             return LucideIcons.pencil;
    case 'zap':                return LucideIcons.zap;
    case 'smile':              return LucideIcons.smile;
    case 'eye':                return LucideIcons.eye;
    case 'user':               return LucideIcons.user;
    case 'star':               return LucideIcons.star;
    case 'wand':
    case 'wand_2':             return LucideIcons.wand;
    case 'circle_half':
    case 'contrast':           return LucideIcons.contrast;
    case 'palette':            return LucideIcons.palette;
    case 'camera':             return LucideIcons.camera;
    case 'monitor':            return LucideIcons.monitor;
    case 'refresh':            return LucideIcons.refreshCw;
    case 'crop':               return LucideIcons.crop;
    case 'focus':              return LucideIcons.focus;
    case 'aperture':           return LucideIcons.aperture;
    case 'cloud':              return LucideIcons.cloud;
    case 'moon':               return LucideIcons.moon;
    case 'flame':              return LucideIcons.flame;
    case 'leaf':               return LucideIcons.leaf;
    default:                   return LucideIcons.wand;
  }
}

Color _parseHexColor(String? hex, Color fallback) {
  if (hex == null || hex.isEmpty) return fallback;
  final clean = hex.replaceAll('#', '');
  if (clean.length == 6) {
    return Color(int.parse('FF$clean', radix: 16));
  }
  if (clean.length == 8) {
    return Color(int.parse(clean, radix: 16));
  }
  return fallback;
}

class EditorPromptInput extends StatefulWidget {
  final EditorController ctrl;
  final String? initialPrompt;

  const EditorPromptInput({super.key, required this.ctrl, this.initialPrompt});

  @override
  State<EditorPromptInput> createState() => _EditorPromptInputState();
}

class _EditorPromptInputState extends State<EditorPromptInput> {
  late final TextEditingController _promptCtrl;
  int _promptLength = 0;
  AiModel? _selectedModel;
  String? _quickPickSnapshot;

  bool get _isQuickPick =>
      _quickPickSnapshot != null && _promptCtrl.text == _quickPickSnapshot;

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
  void initState() {
    super.initState();
    _promptCtrl = TextEditingController(text: widget.initialPrompt ?? '');
    _promptLength = _promptCtrl.text.length;
    _promptCtrl.addListener(() {
      setState(() => _promptLength = _promptCtrl.text.length);
    });
    _restoreCachedModel();
  }

  void _restoreCachedModel() {
    final cachedId = Get.find<AuthRepo>().selectedAiModelId;
    if (cachedId == null) return;
    final allModels = Get.find<DashboardController>().aiModelList;
    final models = allModels.where((m) => m.type == 'IMAGE' || m.type == null).toList();
    _selectedModel = models.firstWhereOrNull((m) => m.id == cachedId);
  }

  @override
  void dispose() {
    _promptCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.ctrl.isGenerating) return;
    if (Get.find<ConfigController>().isDemoMode) {
      showCustomSnackBar('demo_mode_edit_disabled'.tr);
      return;
    }
    final template = widget.ctrl.selectedTemplate;
    final text = _promptCtrl.text.trim();
    if (template == null && text.isEmpty) return;
    if (Get.isRegistered<VoiceInputController>()) {
      Get.find<VoiceInputController>().stopListening();
    }
    final dashCtrl = Get.find<DashboardController>();
    final imageModels = dashCtrl.aiModelList.where((m) => m.type == 'IMAGE' || m.type == null).toList();
    final modelId = (_selectedModel ?? imageModels.firstOrNull)?.id ?? '';
    await widget.ctrl.applyEdit(
      template != null ? '' : text,
      modelId,
      templateId: template?.id,
    );
    _promptCtrl.clear();
    _quickPickSnapshot = null;
  }

  void _fillFromQuickPick(String text) {
    _promptCtrl.text = text;
    _quickPickSnapshot = text;
    setState(() => _promptLength = _promptCtrl.text.length);
  }

  void _showTrySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.6,
        expand: false,
        builder: (ctx, scrollCtrl) => GetBuilder<HomeController>(
          builder: (homeCtrl) {
            final prompts = homeCtrl.suggestions ?? [];
            return Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36, height: 4,
                        decoration: BoxDecoration(color: Theme.of(ctx).colorScheme.outline, borderRadius: BorderRadius.circular(2)),
                      ),
                    ),

                    const SizedBox(height: 14),

                    Text('trending_prompts'.tr, style: robotoBold.copyWith(fontSize: 16, color: Theme.of(ctx).colorScheme.onSurface)),
                  ],
                ),
              ),

              Expanded(
                child: prompts.isEmpty
                    ? const Center(
                        child: SizedBox(
                          width: 24, height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gradientEnd),
                        ),
                      )
                    : ListView.builder(
                        controller: scrollCtrl,
                        padding: const EdgeInsets.fromLTRB(20, 4, 20, 36),
                        itemCount: prompts.length,
                        itemBuilder: (ctx, i) {
                          final color = _chipColors[i % _chipColors.length];
                          return GestureDetector(
                            onTap: () {
                              widget.ctrl.clearTemplate();
                              _fillFromQuickPick(prompts[i]);
                              Navigator.pop(ctx);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: Theme.of(ctx).colorScheme.onSurface.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(children: [
                                Container(
                                  width: 8, height: 8,
                                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                                ),

                                const SizedBox(width: 10),

                                Flexible(
                                  child: Text(
                                    prompts[i],
                                    style: robotoRegular.copyWith(fontSize: 14, color: Theme.of(ctx).colorScheme.onSurface),
                                  ),
                                ),
                              ]),
                            ),
                          );
                        },
                      ),
              ),
            ]);
          },
        ),
      ),
    );
  }

  void _showEffectSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollCtrl) => DefaultTabController(
          length: 2,
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: Dimensions.paddingSizeDefault),
              child: Center(
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(color: Theme.of(ctx).colorScheme.outline, borderRadius: BorderRadius.circular(2)),
                ),
              ),
            ),

            _ModernTabBar(),

            const SizedBox(height: Dimensions.paddingSizeDefault),

            Expanded(
              child: TabBarView(children: [
                _buildEffectsTab(ctx, scrollCtrl),
                EditorTemplatesView(
                  scrollController: scrollCtrl,
                  onSelect: (t) {
                    widget.ctrl.selectTemplate(t);
                    _fillFromQuickPick('apply_template'.trParams({'title': t.title ?? ''}));
                    Navigator.pop(ctx);
                  },
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildEffectsTab(BuildContext ctx, ScrollController scrollCtrl) {
    return GetBuilder<DashboardController>(builder: (dashCtrl) {
      final categories = dashCtrl.effectModel?.categories ?? [];
      if (categories.isEmpty) {
        return const Center(
          child: SizedBox(
            width: 24, height: 24,
            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gradientEnd),
          ),
        );
      }
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(Dimensions.paddingSizeLarge, 0, Dimensions.paddingSizeLarge, Dimensions.paddingSizeSmall),
          child: Text(
            'effect_sheet_hint'.tr,
            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall + 1, color: Theme.of(ctx).colorScheme.onSurfaceVariant),
          ),
        ),

        Expanded(
          child: ListView.builder(
            controller: scrollCtrl,
            padding: const EdgeInsets.fromLTRB(Dimensions.paddingSizeLarge, 4, Dimensions.paddingSizeLarge, 36),
            itemCount: categories.length,
            itemBuilder: (ctx, catIdx) {
              final cat = categories[catIdx];
          final catColor = _parseHexColor(cat.color, AppColors.gradientEnd);
          final effects = cat.effects ?? [];
          final rowCount = (effects.length / 2).ceil();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (catIdx > 0) const SizedBox(height: Dimensions.paddingSizeLarge),

              Text(
                (cat.title ?? '').toUpperCase(),
                style: robotoBold.copyWith(fontSize: 11, color: catColor, letterSpacing: 0.8),
              ),

              const SizedBox(height: Dimensions.paddingSizeSmall),

              ...List.generate(rowCount, (rowIdx) {
                final leftIdx = rowIdx * 2;
                final rightIdx = rowIdx * 2 + 1;
                return Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeEight),
                  child: Row(children: [
                    Expanded(
                      child: _EffectChip(
                        effect: effects[leftIdx],
                        onTap: () {
                          widget.ctrl.clearTemplate();
                          _fillFromQuickPick(effects[leftIdx].prompt ?? '');
                          Navigator.pop(ctx);
                        },
                      ),
                    ),

                    const SizedBox(width: Dimensions.paddingSizeEight),

                    if (rightIdx < effects.length)
                      Expanded(
                        child: _EffectChip(
                          effect: effects[rightIdx],
                          onTap: () {
                            widget.ctrl.clearTemplate();
                            _fillFromQuickPick(effects[rightIdx].prompt ?? '');
                            Navigator.pop(ctx);
                          },
                        ),
                      )
                    else
                      const Expanded(child: SizedBox()),
                  ]),
                );
              }),
            ],
          );
            },
          ),
        ),
      ]);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: GetBuilder<EditorController>(builder: (ctrl) {
        final generating = ctrl.isGenerating;
        final templateLocked = ctrl.hasSelectedTemplate;
        final inputsDisabled = generating || templateLocked;
        final hint = ctrl.isLassoActive && ctrl.lassoClosed ? 'edit_this_area'.tr : 'describe_your_edit'.tr;

        return GetBuilder<DashboardController>(builder: (dashCtrl) {
          final allModels = dashCtrl.aiModelList;
          final models = allModels.where((m) => m.type == 'IMAGE' || m.type == null).toList();
          final effective = _selectedModel ?? models.firstOrNull;
          final creditCost = effective?.creditCost;
          final modelLabel = effective?.label ?? 'model'.tr;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (creditCost != null || _isQuickPick) ...[
                Row(children: [
                  if (_isQuickPick)
                    Expanded(
                      child: Row(children: [
                        Container(
                          width: 8, height: 8,
                          decoration: const BoxDecoration(color: AppColors.gradientEnd, shape: BoxShape.circle),
                        ),

                        const SizedBox(width: 6),

                        Flexible(
                          child: Text(
                            'ready_press_enter'.tr,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: robotoRegular.copyWith(
                              fontSize: 11,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ]),
                    )
                  else
                    const Spacer(),

                  if (creditCost != null) ...[
                    const SizedBox(width: 8),

                    Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(LucideIcons.zap, size: 11, color: AppColors.gradientEnd),

                      const SizedBox(width: 3),

                      RichText(
                        text: TextSpan(children: [
                          TextSpan(
                            text: creditCost % 1 == 0 ? '${creditCost.toInt()}' : '$creditCost',
                            style: robotoBold.copyWith(fontSize: 11, color: AppColors.gradientEnd),
                          ),
                          TextSpan(
                            text: ' ${(creditCost == 1 ? 'credit_per_prompt' : 'per_prompt').tr}',
                            style: robotoRegular.copyWith(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.6)),
                          ),
                        ]),
                      ),
                    ]),
                  ],
                ]),
                const SizedBox(height: 6),
              ],

              Container(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).colorScheme.outline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
              Row(children: [
                if (generating)
                  const Padding(
                    padding: EdgeInsets.only(right: 8),
                    child: SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gradientEnd),
                    ),
                  ),

                Expanded(
                  child: TextField(
                    controller: _promptCtrl,
                    enabled: !generating,
                    readOnly: templateLocked,
                    maxLength: AppConstants.maxPromptLength,
                    decoration: InputDecoration(
                      hintText: hint,
                      hintStyle: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 14),
                      border: InputBorder.none,
                      counterText: '',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurface, fontSize: 14),
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _submit(),
                  ),
                ),

                if (templateLocked)
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: GestureDetector(
                      onTap: generating ? null : () {
                        widget.ctrl.clearTemplate();
                        _promptCtrl.clear();
                        _quickPickSnapshot = null;
                        setState(() => _promptLength = 0);
                      },
                      child: Container(
                        width: 26, height: 26,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.close_rounded,
                          color: Theme.of(context).colorScheme.onSurface,
                          size: 16,
                        ),
                      ),
                    ),
                  ),

                if (!inputsDisabled)
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: VoiceInputButtonWidget(
                      textController: _promptCtrl,
                      size: 32,
                      iconSize: 18,
                    ),
                  ),

                if (_promptLength > 0)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: GestureDetector(
                      onTap: generating ? null : _submit,
                      child: Container(
                        width: 34, height: 34,
                        decoration: BoxDecoration(
                          gradient: generating
                              ? null
                              : const LinearGradient(
                                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                          color: generating ? Theme.of(context).colorScheme.outline : null,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                  ),
              ]),

              const SizedBox(height: 8),

              Row(children: [
                Expanded(
                  child: PopupMenuButton<AiModel>(
                    enabled: !inputsDisabled && models.isNotEmpty,
                    onSelected: (m) {
                      setState(() => _selectedModel = m);
                      Get.find<AuthRepo>().saveSelectedAiModelId(m.id ?? '');
                    },
                    offset: const Offset(0, -8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    color: Theme.of(context).colorScheme.surface,
                    itemBuilder: (ctx) => models.map((m) {
                      final isSelected = m.id == effective?.id;
                      return PopupMenuItem<AiModel>(
                        value: m,
                        child: Text(
                          m.label ?? '',
                          style: robotoMedium.copyWith(
                            fontSize: 14,
                            color: isSelected ? AppColors.gradientEnd : Theme.of(ctx).colorScheme.onSurface,
                          ),
                        ),
                      );
                    }).toList(),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [AppColors.gradientStart, AppColors.gradientEnd],
                        ).createShader(bounds),
                        child: const Icon(Icons.local_fire_department, size: 18, color: Colors.white),
                      ),

                      const SizedBox(width: 4),

                      Flexible(
                        child: Text(
                          modelLabel.contains('(') ? modelLabel.split('(').first.trim() : modelLabel,
                          style: robotoMedium.copyWith(fontSize: 13, color: Theme.of(context).colorScheme.onSurface),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),

                      const SizedBox(width: 2),

                      Icon(Icons.keyboard_arrow_down, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ]),
                  ),
                ),

                const SizedBox(width: 8),

                GestureDetector(
                  onTap: inputsDisabled ? null : _showTrySheet,
                  child: Opacity(
                    opacity: inputsDisabled ? 0.4 : 1.0,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(LucideIcons.trendingUp, size: 15, color: Theme.of(context).colorScheme.onSurfaceVariant),

                      const SizedBox(width: 4),

                      Text('try'.tr, style: robotoMedium.copyWith(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ]),
                  ),
                ),

                const SizedBox(width: 14),

                GestureDetector(
                  onTap: inputsDisabled ? null : _showEffectSheet,
                  child: Opacity(
                    opacity: inputsDisabled ? 0.4 : 1.0,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.auto_awesome, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),

                      const SizedBox(width: 4),

                      Text('presets'.tr, style: robotoMedium.copyWith(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ]),
                  ),
                ),
              ]),
            ],
          ),
        ),
            ],
          );
        });
      }),
    );
  }
}

class _ModernTabBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: scheme.onSurface.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
      ),
      child: TabBar(
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault + 1),
          gradient: AppColors.mainGradient,
          boxShadow: [
            BoxShadow(
              color: AppColors.gradientEnd.withValues(alpha: 0.25),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        indicatorPadding: EdgeInsets.zero,
        dividerColor: Colors.transparent,
        splashFactory: NoSplash.splashFactory,
        overlayColor: WidgetStateProperty.all(Colors.transparent),
        labelColor: Colors.white,
        unselectedLabelColor: scheme.onSurfaceVariant,
        labelStyle: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
        unselectedLabelStyle: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
        padding: EdgeInsets.zero,
        tabs: [
          Tab(
            height: 38,
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.auto_awesome, size: 16),

              const SizedBox(width: 6),

              Text('effects'.tr),
            ]),
          ),
          Tab(
            height: 38,
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(LucideIcons.image, size: 16),

              const SizedBox(width: 6),

              Text('templates'.tr),
            ]),
          ),
        ],
      ),
    );
  }
}

class _EffectChip extends StatelessWidget {
  final Effects effect;
  final VoidCallback onTap;

  const _EffectChip({required this.effect, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(children: [
          Icon(_mapLucideIcon(effect.icon), size: 15, color: Theme.of(context).colorScheme.onSurface),

          const SizedBox(width: 7),

          Flexible(
            child: Text(
              effect.label ?? '',
              style: robotoMedium.copyWith(fontSize: 13, color: Theme.of(context).colorScheme.onSurface),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ]),
      ),
    );
  }
}
