import 'package:get/get.dart';
import 'package:lumen/features/activity/models/paginated_activity_model.dart';
import 'package:lumen/features/activity/repo/activity_repo.dart';

class ActivityGroup {
  final String label;
  final List<Edits> edits;
  ActivityGroup({required this.label, required this.edits});
}

class ActivityController extends GetxController implements GetxService {
  final ActivityRepo _activityRepo;

  ActivityController({required ActivityRepo activityRepo}) : _activityRepo = activityRepo;

  bool isLoadingMore = false;
  int _currentPage = 1;
  int _totalPages = 1;
  static const int _pageSize = 20;
  String searchQuery = '';
  Stats? stats;
  int totalCount = 0;
  List<Edits>? _edits;

  List<Edits>? get edits => _edits == null ? null : List.unmodifiable(_edits!);
  bool get hasMore => _currentPage < _totalPages;

  List<ActivityGroup> get groupedEdits {
    if (_edits == null || _edits!.isEmpty) return [];
    final groups = <String, List<Edits>>{};
    final order = <String>[];
    for (final edit in _edits!) {
      final label = _dayLabel(edit.createdAt);
      if (!groups.containsKey(label)) {
        groups[label] = [];
        order.add(label);
      }
      groups[label]!.add(edit);
    }
    return order.map((l) => ActivityGroup(label: l, edits: groups[l]!)).toList();
  }

  String _dayLabel(String? isoDate) {
    if (isoDate == null) return '';
    final date = DateTime.tryParse(isoDate)?.toLocal();
    if (date == null) return '';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final itemDay = DateTime(date.year, date.month, date.day);
    final diff = today.difference(itemDay).inDays;
    if (diff == 0) return 'today'.tr;
    if (diff == 1) return 'yesterday'.tr;
    return 'days_ago'.trParams({'count': '$diff'});
  }

  Future<void> loadActivity({bool shouldUpdate = true}) async {
    _currentPage = 1;
    _edits = null;
    if(shouldUpdate){
      update();
    }

    final response = await _activityRepo.getActivity(
      page: _currentPage, pageSize: _pageSize, query: searchQuery,
    );

    if (response.statusCode == 200 && response.body != null) {
      final parsed = PaginatedActivityModel.fromJson(response.body);
      stats = parsed.stats;
      _edits = List.of(parsed.edits ?? []);
      _totalPages = parsed.pagination?.totalPages ?? 1;
      totalCount = parsed.pagination?.total ?? 0;
    } else {
      _edits = [];
    }

    update();
  }

  Future<void> loadMore() async {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    _currentPage++;
    update();

    final response = await _activityRepo.getActivity(
      page: _currentPage, pageSize: _pageSize, query: searchQuery,
    );

    if (response.statusCode == 200 && response.body != null) {
      final parsed = PaginatedActivityModel.fromJson(response.body);
      _edits!.addAll(parsed.edits ?? []);
      _totalPages = parsed.pagination?.totalPages ?? 1;
      totalCount = parsed.pagination?.total ?? totalCount;
    } else {
      _currentPage--;
    }

    isLoadingMore = false;
    update();
  }

  void onSearch(String query) {
    searchQuery = query;
    loadActivity();
  }
  @override
  void onInit() {
    loadActivity(shouldUpdate: false);
    super.onInit();
  }

  void clearSearch() {
    searchQuery = '';
    loadActivity();
  }
}
