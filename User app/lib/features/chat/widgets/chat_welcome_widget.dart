import 'dart:math';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class QuickPromptItem {
  final IconData icon;
  final Color iconColor;
  final String categoryKey;
  final String titleKey;
  final String promptKey;
  final String? badgeKey;

  const QuickPromptItem({
    required this.icon,
    required this.iconColor,
    required this.categoryKey,
    required this.titleKey,
    required this.promptKey,
    this.badgeKey,
  });
}

class ChatWelcomeWidget extends StatefulWidget {
  final void Function(String prompt) onSelectPrompt;

  const ChatWelcomeWidget({super.key, required this.onSelectPrompt});

  @override
  State<ChatWelcomeWidget> createState() => _ChatWelcomeWidgetState();
}

class _ChatWelcomeWidgetState extends State<ChatWelcomeWidget> {
  int _selectedPillarIndex = 0;

  static const List<QuickPromptItem> _govtPrompts = [
    QuickPromptItem(
      icon: Icons.account_balance_rounded,
      iconColor: Color(0xFF34D399),
      categoryKey: 'pillar_govt',
      titleKey: 'quick_prompt_prc_title',
      promptKey: 'quick_prompt_prc_desc',
      badgeKey: 'popular',
    ),
    QuickPromptItem(
      icon: Icons.badge_outlined,
      iconColor: Color(0xFF34D399),
      categoryKey: 'pillar_govt',
      titleKey: 'quick_prompt_emp_title',
      promptKey: 'quick_prompt_emp_desc',
      badgeKey: 'career',
    ),
    QuickPromptItem(
      icon: Icons.description_outlined,
      iconColor: Color(0xFF34D399),
      categoryKey: 'pillar_govt',
      titleKey: 'quick_prompt_sewa_title',
      promptKey: 'quick_prompt_sewa_desc',
      badgeKey: 'popular',
    ),
    QuickPromptItem(
      icon: Icons.terrain_rounded,
      iconColor: Color(0xFFFB7185),
      categoryKey: 'pillar_govt',
      titleKey: 'quick_prompt_basundhara_title',
      promptKey: 'quick_prompt_basundhara_desc',
    ),
    QuickPromptItem(
      icon: Icons.eco_rounded,
      iconColor: Color(0xFFA3E635),
      categoryKey: 'pillar_govt',
      titleKey: 'quick_prompt_ration_title',
      promptKey: 'quick_prompt_ration_desc',
    ),
  ];

  static const List<QuickPromptItem> _educationPrompts = [
    QuickPromptItem(
      icon: Icons.school_rounded,
      iconColor: Color(0xFF818CF8),
      categoryKey: 'pillar_education',
      titleKey: 'quick_prompt_apsc_title',
      promptKey: 'quick_prompt_apsc_desc',
      badgeKey: 'career',
    ),
    QuickPromptItem(
      icon: Icons.work_outline_rounded,
      iconColor: Color(0xFF818CF8),
      categoryKey: 'pillar_education',
      titleKey: 'quick_prompt_adre_title',
      promptKey: 'quick_prompt_adre_desc',
      badgeKey: 'jobs',
    ),
    QuickPromptItem(
      icon: Icons.card_giftcard_rounded,
      iconColor: Color(0xFF818CF8),
      categoryKey: 'pillar_education',
      titleKey: 'quick_prompt_scholarship_title',
      promptKey: 'quick_prompt_scholarship_desc',
    ),
    QuickPromptItem(
      icon: Icons.shield_outlined,
      iconColor: Color(0xFF60A5FA),
      categoryKey: 'pillar_education',
      titleKey: 'quick_prompt_police_title',
      promptKey: 'quick_prompt_police_desc',
    ),
    QuickPromptItem(
      icon: Icons.menu_book_rounded,
      iconColor: Color(0xFFA78BFA),
      categoryKey: 'pillar_education',
      titleKey: 'quick_prompt_tet_title',
      promptKey: 'quick_prompt_tet_desc',
    ),
  ];

  static const List<QuickPromptItem> _explorePrompts = [
    QuickPromptItem(
      icon: Icons.explore_rounded,
      iconColor: Color(0xFF38BDF8),
      categoryKey: 'pillar_explore',
      titleKey: 'quick_prompt_safari_title',
      promptKey: 'quick_prompt_safari_desc',
      badgeKey: 'wildlife',
    ),
    QuickPromptItem(
      icon: Icons.temple_hindu_rounded,
      iconColor: Color(0xFF38BDF8),
      categoryKey: 'pillar_explore',
      titleKey: 'quick_prompt_heritage_title',
      promptKey: 'quick_prompt_heritage_desc',
    ),
    QuickPromptItem(
      icon: Icons.festival_rounded,
      iconColor: Color(0xFF38BDF8),
      categoryKey: 'pillar_explore',
      titleKey: 'quick_prompt_culture_title',
      promptKey: 'quick_prompt_culture_desc',
    ),
    QuickPromptItem(
      icon: Icons.directions_boat_rounded,
      iconColor: Color(0xFF2DD4BF),
      categoryKey: 'pillar_explore',
      titleKey: 'quick_prompt_tea_title',
      promptKey: 'quick_prompt_tea_desc',
    ),
    QuickPromptItem(
      icon: Icons.park_rounded,
      iconColor: Color(0xFF34D399),
      categoryKey: 'pillar_explore',
      titleKey: 'quick_prompt_haflong_title',
      promptKey: 'quick_prompt_haflong_desc',
    ),
  ];

  static const List<QuickPromptItem> _toolsPrompts = [
    QuickPromptItem(
      icon: Icons.translate_rounded,
      iconColor: Color(0xFF22D3EE),
      categoryKey: 'pillar_tools',
      titleKey: 'quick_prompt_trans_title',
      promptKey: 'quick_prompt_trans_desc',
      badgeKey: 'multilingual',
    ),
    QuickPromptItem(
      icon: Icons.business_center_rounded,
      iconColor: Color(0xFFFBBF24),
      categoryKey: 'pillar_tools',
      titleKey: 'quick_prompt_trade_title',
      promptKey: 'quick_prompt_trade_desc',
    ),
    QuickPromptItem(
      icon: Icons.find_in_page_rounded,
      iconColor: Color(0xFFC084FC),
      categoryKey: 'pillar_tools',
      titleKey: 'quick_prompt_doc_title',
      promptKey: 'quick_prompt_doc_desc',
      badgeKey: 'docs',
    ),
    QuickPromptItem(
      icon: Icons.edit_note_rounded,
      iconColor: Color(0xFFFB923C),
      categoryKey: 'pillar_tools',
      titleKey: 'quick_prompt_letter_title',
      promptKey: 'quick_prompt_letter_desc',
    ),
    QuickPromptItem(
      icon: Icons.rocket_launch_rounded,
      iconColor: Color(0xFFF472B6),
      categoryKey: 'pillar_tools',
      titleKey: 'quick_prompt_startup_title',
      promptKey: 'quick_prompt_startup_desc',
    ),
  ];

  List<List<QuickPromptItem>> get _allPillars => [
    _govtPrompts,
    _educationPrompts,
    _explorePrompts,
    _toolsPrompts,
  ];

  List<String> get _pillarLabels => [
    'pillar_govt',
    'pillar_education',
    'pillar_explore',
    'pillar_tools',
  ];

  late List<QuickPromptItem> _currentItems;

  @override
  void initState() {
    super.initState();
    _currentItems = List.from(_govtPrompts);
  }

  void _onPillarSelected(int index) {
    setState(() {
      _selectedPillarIndex = index;
      _currentItems = List.from(_allPillars[index]);
    });
  }

  void _shufflePrompts() {
    final random = Random();
    final shuffled = List<QuickPromptItem>.from(_allPillars[_selectedPillarIndex])..shuffle(random);
    setState(() {
      _currentItems = shuffled;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.gradientStart, AppColors.gradientEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gradientStart.withValues(alpha: 0.35),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 14),

          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'YUMPASS AI',
                style: robotoBold.copyWith(
                  fontSize: Dimensions.fontSizeExtraLarge + 2,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.gradientStart.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'PRO',
                  style: robotoBold.copyWith(
                    fontSize: 10,
                    color: AppColors.gradientStart,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'brand_slogan'.tr,
              textAlign: TextAlign.center,
              style: robotoRegular.copyWith(
                fontSize: Dimensions.fontSizeSmall,
                color: colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Pillar category tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(_pillarLabels.length, (i) {
                final isSelected = _selectedPillarIndex == i;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      _pillarLabels[i].tr,
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeSmall - 0.5,
                        color: isSelected ? Colors.white : colorScheme.onSurface,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppColors.gradientStart,
                    backgroundColor: colorScheme.surfaceContainerHighest,
                    side: BorderSide(
                      color: isSelected
                          ? AppColors.gradientStart
                          : colorScheme.outline.withValues(alpha: 0.3),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    showCheckmark: false,
                    onSelected: (_) => _onPillarSelected(i),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),

          // Header with count and shuffle
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _pillarLabels[_selectedPillarIndex].tr,
                style: robotoMedium.copyWith(
                  fontSize: Dimensions.fontSizeSmall,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              InkWell(
                onTap: _shufflePrompts,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shuffle_rounded, size: 14, color: AppColors.gradientStart),
                      const SizedBox(width: 4),
                      Text(
                        'refresh_prompts'.tr,
                        style: robotoMedium.copyWith(
                          fontSize: Dimensions.fontSizeExtraSmall + 1,
                          color: AppColors.gradientStart,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Cards list
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _currentItems.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (ctx, idx) {
              final item = _currentItems[idx];
              return _PromptCardWidget(
                item: item,
                onTap: () => widget.onSelectPrompt(item.promptKey.tr),
              );
            },
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _PromptCardWidget extends StatelessWidget {
  final QuickPromptItem item;
  final VoidCallback onTap;

  const _PromptCardWidget({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            border: Border.all(
              color: colorScheme.outline.withValues(alpha: 0.35),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: item.iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: item.iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.titleKey.tr,
                            style: robotoMedium.copyWith(
                              fontSize: Dimensions.fontSizeDefault - 1,
                              color: colorScheme.onSurface,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (item.badgeKey != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: item.iconColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              item.badgeKey!.tr,
                              style: robotoBold.copyWith(
                                fontSize: 9.5,
                                color: item.iconColor,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.promptKey.tr,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeExtraSmall + 1.5,
                        color: colorScheme.onSurfaceVariant,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.arrow_outward_rounded,
                size: 16,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
