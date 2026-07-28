class PromtSuggestions {
  List<String>? suggestions;

  PromtSuggestions({this.suggestions});

  PromtSuggestions.fromJson(Map<String, dynamic> json) {
    suggestions = json['suggestions'].cast<String>();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['suggestions'] = suggestions;
    return data;
  }
}
