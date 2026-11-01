import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoClipEditorDialog extends StatefulWidget {
  final int clipIndex;
  final TimelineClipModel clip;

  const VideoClipEditorDialog({
    super.key,
    required this.clipIndex,
    required this.clip,
  });

  static Future<void> show(BuildContext context, int clipIndex, TimelineClipModel clip) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => VideoClipEditorDialog(clipIndex: clipIndex, clip: clip),
    );
  }

  @override
  State<VideoClipEditorDialog> createState() => _VideoClipEditorDialogState();
}

class _VideoClipEditorDialogState extends State<VideoClipEditorDialog> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late int _length;
  late int _trim;
  late String? _transitionIn;
  late String? _transitionOut;
  late String? _filter;
  late String? _effect;
  late String _fit;
  late double _speed;
  late double _volume;
  late bool _isMuted;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _length = widget.clip.length;
    _trim = widget.clip.trim;
    _transitionIn = widget.clip.transitionIn;
    _transitionOut = widget.clip.transitionOut;
    _filter = widget.clip.filter;
    _effect = widget.clip.effect;
    _fit = widget.clip.fit ?? 'cover';
    _speed = widget.clip.speed;
    _volume = widget.clip.volume ?? 1.0;
    _isMuted = (widget.clip.volume ?? 1.0) == 0.0;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<VideoEditorController>();

    return SafeArea(
      child: Container(
        height: MediaQuery.of(context).size.height * 0.75,
        padding: EdgeInsets.only(
          left: Dimensions.paddingSizeLarge,
          right: Dimensions.paddingSizeLarge,
          top: Dimensions.paddingSizeLarge,
          bottom: MediaQuery.of(context).viewInsets.bottom + Dimensions.paddingSizeLarge,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Title & Close
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${'edit_clip'.tr} #${widget.clipIndex + 1}',
                  style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Segmented 4 Tabs
            TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: AppColors.gradientStart,
              unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
              indicatorColor: AppColors.gradientStart,
              tabs: [
                Tab(text: 'transform_and_speed'.tr),
                Tab(text: 'transitions_in_out'.tr),
                Tab(text: 'motion_effects'.tr),
                Tab(text: 'filter'.tr),
              ],
            ),
            const SizedBox(height: 12),

            // Tab Views Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildTransformTab(ctrl),
                  _buildTransitionsTab(ctrl),
                  _buildMotionTab(ctrl),
                  _buildFilterTab(ctrl),
                ],
              ),
            ),

            // Delete Clip Action Button at bottom
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent),
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
              ),
              onPressed: () {
                ctrl.removeClip(widget.clipIndex);
                Navigator.pop(context);
              },
              icon: const Icon(Icons.delete_outline, size: 18),
              label: Text('delete_clip'.tr, style: robotoMedium),
            ),
          ],
        ),
      ),
    );
  }

  // TAB 1: Transform, Speed, Trim, Volume
  Widget _buildTransformTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Duration
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('clip_duration'.trParams({'seconds': '$_length'}), style: robotoMedium),
            ],
          ),
          Slider(
            value: _length.toDouble(),
            min: 1,
            max: 30,
            divisions: 29,
            activeColor: AppColors.gradientStart,
            label: '$_length s',
            onChanged: (val) {
              setState(() => _length = val.round());
              ctrl.updateClipDuration(widget.clipIndex, _length);
            },
          ),
          const SizedBox(height: 8),

          // Start Trim
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('clip_trim'.trParams({'seconds': '$_trim'}), style: robotoMedium),
            ],
          ),
          Slider(
            value: _trim.toDouble(),
            min: 0,
            max: 30,
            divisions: 30,
            activeColor: AppColors.gradientEnd,
            label: '$_trim s',
            onChanged: (val) {
              setState(() => _trim = val.round());
              ctrl.updateClipTrim(widget.clipIndex, _trim);
            },
          ),
          const SizedBox(height: 12),

          // Fit Mode
          Text('fit_mode'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
          const SizedBox(height: 6),
          Row(
            children: AppConstants.videoFitModes.map((m) {
              final isSel = _fit == m['value'];
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(m['label']!.tr, style: robotoMedium.copyWith(fontSize: 11)),
                  selected: isSel,
                  selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                  onSelected: (_) {
                    setState(() => _fit = m['value']!);
                    ctrl.setClipFit(widget.clipIndex, m['value']!);
                  },
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          // Playback Speed
          Text('playback_speed'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: AppConstants.videoSpeedMultipliers.map((spd) {
                final isSel = _speed == spd;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text('${spd}x', style: robotoMedium.copyWith(fontSize: 11)),
                    selected: isSel,
                    selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                    onSelected: (_) {
                      setState(() => _speed = spd);
                      ctrl.setClipSpeed(widget.clipIndex, spd);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // Clip Audio Volume & Mute Switch
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('clip_volume'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              Row(
                children: [
                  Text('mute_clip_audio'.tr, style: robotoRegular.copyWith(fontSize: 11)),
                  Switch(
                    value: _isMuted,
                    activeThumbColor: Colors.redAccent,
                    onChanged: (val) {
                      setState(() {
                        _isMuted = val;
                        _volume = val ? 0.0 : 1.0;
                      });
                      ctrl.setClipVolume(widget.clipIndex, _volume);
                    },
                  ),
                ],
              ),
            ],
          ),
          if (!_isMuted)
            Slider(
              value: _volume,
              min: 0.0,
              max: 1.0,
              divisions: 10,
              activeColor: AppColors.gradientStart,
              label: '${(_volume * 100).round()}%',
              onChanged: (val) {
                setState(() => _volume = val);
                ctrl.setClipVolume(widget.clipIndex, val);
              },
            ),
        ],
      ),
    );
  }

  // TAB 2: Transitions In & Out
  Widget _buildTransitionsTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('transition_in'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: AppConstants.videoTransitions.map((t) {
              final isSel = (_transitionIn ?? '') == t['value'];
              return ChoiceChip(
                label: Text(t['label']!.tr, style: robotoRegular.copyWith(fontSize: 11)),
                selected: isSel,
                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                onSelected: (_) {
                  final val = t['value']!.isEmpty ? null : t['value'];
                  setState(() => _transitionIn = val);
                  ctrl.setClipTransitionIn(widget.clipIndex, val);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          Text('transition_out'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: AppConstants.videoTransitions.map((t) {
              final isSel = (_transitionOut ?? '') == t['value'];
              return ChoiceChip(
                label: Text(t['label']!.tr, style: robotoRegular.copyWith(fontSize: 11)),
                selected: isSel,
                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                onSelected: (_) {
                  final val = t['value']!.isEmpty ? null : t['value'];
                  setState(() => _transitionOut = val);
                  ctrl.setClipTransitionOut(widget.clipIndex, val);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // TAB 3: Motion / Ken Burns
  Widget _buildMotionTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('motion_effects'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: AppConstants.videoMotionEffects.map((m) {
              final isSel = (_effect ?? '') == m['value'];
              return ChoiceChip(
                avatar: Icon(
                  m['value']!.isEmpty ? Icons.block_rounded : Icons.camera_alt_outlined,
                  size: 14,
                  color: isSel ? AppColors.gradientStart : Colors.grey,
                ),
                label: Text(m['label']!.tr, style: robotoRegular.copyWith(fontSize: 11)),
                selected: isSel,
                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                onSelected: (_) {
                  final val = m['value']!.isEmpty ? null : m['value'];
                  setState(() => _effect = val);
                  ctrl.setClipMotionEffect(widget.clipIndex, val);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // TAB 4: Color Filters
  Widget _buildFilterTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('filter'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: AppConstants.videoFilters.map((f) {
              final isSel = (_filter ?? '') == f['value'];
              return ChoiceChip(
                label: Text(f['label']!.tr, style: robotoRegular.copyWith(fontSize: 11)),
                selected: isSel,
                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                onSelected: (_) {
                  final val = f['value']!.isEmpty ? null : f['value'];
                  setState(() => _filter = val);
                  ctrl.setClipFilter(widget.clipIndex, val);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
