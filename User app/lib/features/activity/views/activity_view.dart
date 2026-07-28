import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/activity/controllers/activity_controller.dart';
import 'package:lumen/features/activity/widgets/activity_edit_item_widget.dart';
import 'package:lumen/features/activity/widgets/activity_search_widget.dart';
import 'package:lumen/features/activity/widgets/activity_shimmer_widget.dart';
import 'package:lumen/features/activity/widgets/activity_stats_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ActivityView extends StatefulWidget {
  const ActivityView({super.key});

  @override
  State<ActivityView> createState() => _ActivityViewState();
}


class _ActivityViewState extends State<ActivityView> {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Dimensions.paddingSizeLarge, Dimensions.fontSizeLarge,
                Dimensions.paddingSizeLarge, Dimensions.fontSizeSmall,
              ),
              child: Text(
                'activity'.tr,
                style: robotoBold.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: Dimensions.fontSizeOverLarge,
                ),
              ),
            ),

            Expanded(
              child: GetBuilder<ActivityController>(
                builder: (c) => RefreshIndicator(
                  onRefresh: () async => c.loadActivity(shouldUpdate: false),
                  child: NotificationListener<ScrollNotification>(
                    onNotification: (n) {
                      if (n is ScrollEndNotification && n.metrics.extentAfter < 200) {
                        c.loadMore();
                      }
                      return false;
                    },
                    child: CustomScrollView(slivers: _buildSlivers(context, c)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildSlivers(BuildContext context, ActivityController c) {
    const hp = EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge);

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(
          Dimensions.paddingSizeLarge, 0,
          Dimensions.paddingSizeLarge, Dimensions.paddingSizeDefault,
        ),
        sliver: SliverToBoxAdapter(child: ActivityStatsWidget(stats: c.stats)),
      ),

      const SliverPersistentHeader(
        pinned: true,
        delegate: _SearchPinnedDelegate(),
      ),

      if (c.edits == null)
        const SliverPadding(
          padding: hp,
          sliver: SliverToBoxAdapter(child: ActivityShimmerWidget()),
        )
      else if (c.edits!.isEmpty)
        const SliverFillRemaining(
          hasScrollBody: false,
          child: _ActivityEmptyState(),
        )
      else ...[
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            Dimensions.paddingSizeLarge, 0,
            Dimensions.paddingSizeLarge, Dimensions.paddingSizeSmall,
          ),
          sliver: SliverToBoxAdapter(
            child: Text(
              c.totalCount == 1
                  ? 'project_edit_count_single'.trParams({'count': '${c.totalCount}'})
                  : 'project_edit_count_plural'.trParams({'count': '${c.totalCount}'}),
              style: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
          ),
        ),

        for (final group in c.groupedEdits) ...[
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              Dimensions.paddingSizeLarge, 0,
              Dimensions.paddingSizeLarge, Dimensions.paddingSizeSmall,
            ),
            sliver: SliverToBoxAdapter(
              child: _GroupHeader(group: group),
            ),
          ),
          SliverPadding(
            padding: hp,
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) => Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeEight),
                  child: ActivityEditItemWidget(edit: group.edits[i]),
                ),
                childCount: group.edits.length,
              ),
            ),
          ),
        ],

        if (c.isLoadingMore)
          const SliverPadding(
            padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
            sliver: SliverToBoxAdapter(
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
          ),

        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    ];
  }
}

class _GroupHeader extends StatelessWidget {
  final ActivityGroup group;
  const _GroupHeader({required this.group});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Text(
        group.label.toUpperCase(),
        style: robotoMedium.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          fontSize: Dimensions.fontSizeExtraSmall,
          letterSpacing: 0.8,
        ),
      ),

      const SizedBox(width: Dimensions.paddingSizeEight),

      Expanded(
        child: Divider(color: Theme.of(context).colorScheme.outline, height: 1),
      ),

      const SizedBox(width: Dimensions.paddingSizeEight),

      Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Theme.of(context).cardColor,
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Center(
          child: Text(
            '${group.edits.length}',
            style: robotoMedium.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeExtraSmall,
            ),
          ),
        ),
      ),
    ]);
  }
}

class _SearchPinnedDelegate extends SliverPersistentHeaderDelegate {
  const _SearchPinnedDelegate();

  static const double _height = 46.0 + Dimensions.paddingSizeDefault + Dimensions.paddingSizeDefault;

  @override double get minExtent => _height;
  @override double get maxExtent => _height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return ColoredBox(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: const Padding(
        padding: EdgeInsets.symmetric(
          horizontal: Dimensions.paddingSizeLarge,
          vertical: Dimensions.paddingSizeDefault,
        ),
        child: ActivitySearchWidget(),
      ),
    );
  }

  @override
  bool shouldRebuild(_SearchPinnedDelegate oldDelegate) => false;
}

class _ActivityEmptyState extends StatelessWidget {
  const _ActivityEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(
          Icons.history_rounded,
          size: 48,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(height: Dimensions.paddingSizeSmall),
        Text(
          'activity_empty_title'.tr,
          style: robotoMedium.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontSize: Dimensions.fontSizeDefault,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'activity_empty_subtitle'.tr,
          style: robotoRegular.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontSize: Dimensions.fontSizeSmall,
          ),
        ),
      ]),
    );
  }
}
