import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/upgrade/widgets/payment_failed_dialog.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';

class PaymentScreen extends StatefulWidget {
  final String url;
  final Plan? plan;

  const PaymentScreen({super.key, required this.url, this.plan});

  @override
  PaymentScreenState createState() => PaymentScreenState();
}

class PaymentScreenState extends State<PaymentScreen> {
  String? selectedUrl;
  double value = 0.0;
  final bool _isLoading = true;
  PullToRefreshController? pullToRefreshController;
  late MyInAppBrowser browser;
  bool _browserInitialized = false;

  @override
  void initState() {
    super.initState();
    selectedUrl = widget.url;
    _initData();
  }

  void _showCancelledDialog() {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const PopScope(
        canPop: false,
        child: AlertDialog(
          contentPadding: EdgeInsets.all(Dimensions.paddingSizeSmall),
          content: PaymentFailedDialog(),
        ),
      ),
    );
  }

  void _initData() async {
    browser = MyInAppBrowser(
      mainUrl: widget.url,
      plan: widget.plan,
      onPaymentCancelled: _showCancelledDialog,
    );
    _browserInitialized = true;

    if (GetPlatform.isAndroid) {
      await InAppWebViewController.setWebContentsDebuggingEnabled(kDebugMode);

      bool swAvailable = await WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE);
      bool swInterceptAvailable = await WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_SHOULD_INTERCEPT_REQUEST);

      if (swAvailable && swInterceptAvailable) {
        ServiceWorkerController serviceWorkerController = ServiceWorkerController.instance();
        await serviceWorkerController.setServiceWorkerClient(ServiceWorkerClient(
          shouldInterceptRequest: (request) async {
            if (kDebugMode) {
              print(request);
            }
            return null;
          },
        ));
      }
    }

    await browser.openUrlRequest(
      urlRequest: URLRequest(url: WebUri(selectedUrl!)),
      settings: InAppBrowserClassSettings(
        webViewSettings: InAppWebViewSettings(
          useShouldOverrideUrlLoading: true,
          useOnLoadResource: true,
        ),
        browserSettings: InAppBrowserSettings(
          hideUrlBar: true,
          hideToolbarTop: GetPlatform.isAndroid,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (_browserInitialized) {
          browser.close();
        } else {
          _showCancelledDialog();
        }
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).colorScheme.primary,
        appBar: AppBar(title: Text('payment_title'.tr)),
        body: Center(
          child: Stack(
            children: [
              _isLoading ? Center(
                child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary)),
              ) : const SizedBox.shrink(),
            ],
          ),
        ),
      ),
    );
  }
}

class MyInAppBrowser extends InAppBrowser {
  final String mainUrl;
  final Plan? plan;
  final VoidCallback onPaymentCancelled;

  MyInAppBrowser({required this.mainUrl, this.plan, required this.onPaymentCancelled});

  bool _canRedirect = true;

  @override
  Future onBrowserCreated() async {
    if (kDebugMode) {
      print("\n\nBrowser Created!\n\n");
    }
  }

  @override
  Future onLoadStart(url) async {
    if (kDebugMode) {
      print("\n\nStarted: $url\n\n");
    }
    _pageRedirect(url.toString());
  }

  @override
  Future onLoadStop(url) async {
    pullToRefreshController?.endRefreshing();
    if (kDebugMode) {
      print("\n\nStopped: $url\n\n");
    }
    _pageRedirect(url.toString());
  }

  @override
  void onLoadError(url, code, message) {
    pullToRefreshController?.endRefreshing();
    if (kDebugMode) {
      print("Can't load [$url] Error: $message");
    }
  }

  @override
  void onProgressChanged(progress) {
    if (progress == 100) {
      pullToRefreshController?.endRefreshing();
    }
    if (kDebugMode) {
      print("Progress: $progress");
    }
  }

  @override
  void onExit() {
    if (_canRedirect) {
      onPaymentCancelled();
    }
    if (kDebugMode) {
      print("\n\nBrowser closed!\n\n");
    }
  }

  @override
  Future<NavigationActionPolicy> shouldOverrideUrlLoading(navigationAction) async {
    if (kDebugMode) {
      print("\n\nOverride ${navigationAction.request.url}\n\n");
    }
    return NavigationActionPolicy.ALLOW;
  }

  @override
  void onLoadResource(resource) {}

  @override
  void onConsoleMessage(consoleMessage) {}

  void _pageRedirect(String url) async {
    if (!_canRedirect) return;

    final uri = Uri.tryParse(url);
    if (uri == null) return;

    final host = uri.host;
    final isOurBase = url.contains(AppConstants.baseUrl) || (AppConstants.baseUrl.contains(host) && host.isNotEmpty);
    if (!isOurBase) return;

    final dataParam = uri.queryParameters['data'];

    // If on /pay/success without ?data=, wait for the backend to verify session and redirect with ?data=
    if (uri.path.contains('pay/success') && (dataParam == null || dataParam.isEmpty)) {
      return;
    }

    bool? isSuccess;
    String? errorMessage;

    if (dataParam != null && dataParam.isNotEmpty) {
      try {
        final decodedStr = utf8.decode(base64Decode(Uri.decodeComponent(dataParam)));
        final data = jsonDecode(decodedStr) as Map<String, dynamic>;
        final status = data['payment_status']?.toString();
        if (status == 'success') {
          isSuccess = true;
        } else {
          isSuccess = false;
          errorMessage = data['error']?.toString();
        }
      } catch (_) {}
    }

    if (isSuccess == null) {
      if (uri.path.contains('cancel') || url.contains('cancel')) {
        isSuccess = false;
      } else if (uri.path.contains('fail') || url.contains('fail')) {
        isSuccess = false;
      } else if (uri.path.contains('success') || url.contains('success')) {
        isSuccess = true;
      }
    }

    if (isSuccess != null) {
      _canRedirect = false;
      close();

      if (isSuccess) {
        Get.back();
        Get.find<ProfileController>().fetchProfile();
        Get.offAllNamed(RouteHelper.getDashboardRoute(), arguments: plan);
      } else {
        Get.back();
        showCustomSnackBar(errorMessage ?? 'transaction_failed'.tr);
      }
    }
  }
}
