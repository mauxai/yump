class AnalyticsModel {
  final int totalProjects;
  final int totalEdits;
  final int creditsUsed;
  final int creditsTotal;
  final int creditsRemaining;
  final List<ModelUsageItem> modelUsage;
  final List<RecentActivityItem> recentActivity;

  AnalyticsModel({
    required this.totalProjects,
    required this.totalEdits,
    required this.creditsUsed,
    required this.creditsTotal,
    required this.creditsRemaining,
    required this.modelUsage,
    required this.recentActivity,
  });

  factory AnalyticsModel.fromJson(Map<String, dynamic> json) {
    final rawModelUsage = json['modelUsage'] as List? ?? [];
    final rawActivity = json['recentActivity'] as List? ?? [];

    return AnalyticsModel(
      totalProjects: json['totalProjects'] ?? 0,
      totalEdits: json['totalEdits'] ?? 0,
      creditsUsed: json['creditsUsed'] ?? 0,
      creditsTotal: json['creditsTotal'] ?? 0,
      creditsRemaining: json['creditsRemaining'] ?? 0,
      modelUsage: rawModelUsage.map((m) => ModelUsageItem.fromJson(m)).toList(),
      recentActivity: rawActivity.map((a) => RecentActivityItem.fromJson(a)).toList(),
    );
  }
}

class ModelUsageItem {
  final String? modelId;
  final String label;
  final int edits;
  final int credits;

  ModelUsageItem({
    this.modelId,
    required this.label,
    required this.edits,
    required this.credits,
  });

  factory ModelUsageItem.fromJson(Map<String, dynamic> json) {
    return ModelUsageItem(
      modelId: json['modelId'],
      label: json['label'] ?? 'Unknown',
      edits: json['edits'] ?? 0,
      credits: json['credits'] ?? 0,
    );
  }
}

class RecentActivityItem {
  final String id;
  final String type;
  final String description;
  final DateTime createdAt;

  RecentActivityItem({
    required this.id,
    required this.type,
    required this.description,
    required this.createdAt,
  });

  factory RecentActivityItem.fromJson(Map<String, dynamic> json) {
    return RecentActivityItem(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      description: json['description'] ?? '',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
