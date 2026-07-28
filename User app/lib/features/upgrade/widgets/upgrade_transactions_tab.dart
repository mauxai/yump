import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/features/upgrade/models/paginated_billing_model.dart';
import 'package:lumen/helper/price_converter.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class UpgradeTransactionsTab extends GetView<UpgradeController> {
  const UpgradeTransactionsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(
        padding: EdgeInsets.fromLTRB(
          Dimensions.paddingSizeLarge, Dimensions.paddingSizeDefault,
          Dimensions.paddingSizeLarge, 0,
        ),
        child: _BillingToolbar(),
      ),

      const SizedBox(height: Dimensions.paddingSizeDefault),

      Expanded(
        child: GetBuilder<UpgradeController>(
          builder: (c) => NotificationListener<ScrollNotification>(
            onNotification: (n) {
              if (n is ScrollEndNotification && n.metrics.extentAfter < 200) {
                c.loadMoreBillingHistory();
              }
              return false;
            },
            child: _buildBody(context, c),
          ),
        ),
      ),
    ]);
  }

  Widget _buildBody(BuildContext context, UpgradeController c) {
    if (c.isLoadingBilling) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }
    if (c.billingHistory.isEmpty) {
      return const _BillingEmptyState();
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(
        Dimensions.paddingSizeLarge, 0,
        Dimensions.paddingSizeLarge, 100,
      ),
      itemCount: c.billingHistory.length + (c.isLoadingMoreBilling ? 1 : 0),
      separatorBuilder: (_, __) => const SizedBox(height: Dimensions.paddingSizeEight),
      itemBuilder: (_, i) {
        if (i == c.billingHistory.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }
        return _BillingCard(item: c.billingHistory[i]);
      },
    );
  }
}

class _BillingToolbar extends StatefulWidget {
  const _BillingToolbar();

  @override
  State<_BillingToolbar> createState() => _BillingToolbarState();
}

class _BillingToolbarState extends State<_BillingToolbar> {
  final _textController = TextEditingController();
  bool _hasText = false;

  static const _statusOptions = ['all', 'paid', 'pending', 'failed', 'refunded'];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onChanged(String value) => setState(() => _hasText = value.isNotEmpty);

  void _onSubmitted(String value) => Get.find<UpgradeController>().onBillingSearch(value.trim());

  void _onClear() {
    _textController.clear();
    setState(() => _hasText = false);
    Get.find<UpgradeController>().clearBillingSearch();
  }

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
        child: Container(
          height: 44,
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: TextField(
            controller: _textController,
            onChanged: _onChanged,
            onSubmitted: _onSubmitted,
            textInputAction: TextInputAction.search,
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeDefault,
            ),
            decoration: InputDecoration(
              hintText: 'search_billing_hint'.tr,
              hintStyle: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeDefault,
              ),
              prefixIcon: Icon(
                Icons.search_rounded,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                size: 20,
              ),
              suffixIcon: _hasText
                  ? GestureDetector(
                      onTap: _onClear,
                      child: Icon(
                        Icons.close_rounded,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        size: 18,
                      ),
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
            ),
          ),
        ),
      ),

      const SizedBox(width: Dimensions.paddingSizeEight),

      GetBuilder<UpgradeController>(
        builder: (c) => _IconButton(
          tooltip: 'filter_status'.tr,
          child: PopupMenuButton<String>(
            icon: Icon(
              Icons.filter_list_rounded,
              color: c.billingStatusFilter.isEmpty
                  ? Theme.of(context).colorScheme.onSurfaceVariant
                  : AppColors.gradientStart,
              size: 22,
            ),
            onSelected: (value) => c.onBillingStatusFilter(value == 'all' ? '' : value),
            itemBuilder: (_) => _statusOptions
                .map((s) => PopupMenuItem<String>(
                      value: s,
                      child: Text(
                        'status_$s'.tr,
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeDefault,
                          color: (s == 'all' && c.billingStatusFilter.isEmpty) ||
                                  s == c.billingStatusFilter
                              ? AppColors.gradientStart
                              : Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ))
                .toList(),
          ),
        ),
      ),

      const SizedBox(width: Dimensions.paddingSizeEight),

      _IconButton(
        tooltip: 'download_transactions'.tr,
        child: IconButton(
          icon: Icon(
            Icons.download_rounded,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: 22,
          ),
          onPressed: () => Get.find<UpgradeController>().downloadBillingExport(),
        ),
      ),
    ]);
  }
}

class _IconButton extends StatelessWidget {
  final Widget child;
  final String tooltip;
  const _IconButton({required this.child, required this.tooltip});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Container(
        height: 44,
        width: 44,
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: child,
      ),
    );
  }
}

class _BillingCard extends StatelessWidget {
  final BillingModel item;
  const _BillingCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Text(
              item.description ?? '',
              style: robotoMedium.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
          ),

          const SizedBox(width: Dimensions.paddingSizeEight),

          _StatusBadge(status: item.status),
        ]),

        if (item.gatewayRef != null && item.gatewayRef!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            'billing_ref'.trParams({'ref': item.gatewayRef!}),
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeSmall,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],

        const SizedBox(height: Dimensions.paddingSizeSmall),

        Row(children: [
          if (item.creditsGranted != null && item.creditsGranted! > 0) ...[
            const Icon(Icons.bolt_rounded, color: AppColors.gradientStart, size: 16),
            const SizedBox(width: 2),
            Text(
              '+${item.creditsGranted}',
              style: robotoMedium.copyWith(
                color: AppColors.gradientStart,
                fontSize: Dimensions.fontSizeSmall,
              ),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),
          ],

          Text(
            PriceConverter.convertPrice(item.amount),
            style: robotoBold.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),

          const Spacer(),

          Text(
            _formatDate(item.createdAt),
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeSmall,
            ),
          ),
        ]),
      ]),
    );
  }


  String _formatDate(String? isoDate) {
    if (isoDate == null) return '';
    final date = DateTime.tryParse(isoDate)?.toLocal();
    if (date == null) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _StatusBadge extends StatelessWidget {
  final String? status;
  const _StatusBadge({this.status});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
        border: Border.all(color: bg.withValues(alpha: 0.3)),
      ),
      child: Text(
        (status ?? '').toUpperCase(),
        style: robotoMedium.copyWith(color: fg, fontSize: Dimensions.fontSizeExtraSmall, letterSpacing: 0.4),
      ),
    );
  }

  (Color, Color) _colors(String? s) {
    switch (s?.toLowerCase()) {
      case 'paid':     return (const Color(0xFF34C759), const Color(0xFF34C759));
      case 'pending':  return (const Color(0xFFFF9500), const Color(0xFFFF9500));
      case 'failed':   return (AppColors.redDot, AppColors.redDot);
      case 'refunded': return (const Color(0xFF5E5CE6), const Color(0xFF5E5CE6));
      default:         return (AppColors.gradientStart, AppColors.gradientStart);
    }
  }
}

class _BillingEmptyState extends StatelessWidget {
  const _BillingEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(
          Icons.receipt_long_outlined,
          size: 48,
          color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
        ),

        const SizedBox(height: Dimensions.paddingSizeSmall),

        Text(
          'no_transactions'.tr,
          style: robotoMedium.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontSize: Dimensions.fontSizeDefault,
          ),
        ),
      ]),
    );
  }
}
