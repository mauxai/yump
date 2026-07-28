#!/bin/bash
# Wrapper for codesign that strips detritus (com.apple.FinderInfo,
# com.apple.fileprovider.fpfs#P, AppleDouble ._* files) before signing.
# Required on macOS 15+/16+ where these xattrs are added by the OS.

TARGET=""
for arg in "$@"; do
  if [[ "$arg" != -* ]]; then
    TARGET="$arg"
  fi
done

if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then
  # Remove ._* AppleDouble metadata files inside the bundle
  find "$TARGET" -name "._*" -delete 2>/dev/null || true
  # Remove known problematic xattrs recursively
  xattr -cr "$TARGET" 2>/dev/null || true
  xattr -d com.apple.FinderInfo "$TARGET" 2>/dev/null || true
  xattr -d "com.apple.fileprovider.fpfs#P" "$TARGET" 2>/dev/null || true
  # Use dot_clean to eliminate any AppleDouble resource forks
  dot_clean -m "$TARGET" 2>/dev/null || true
fi

exec /usr/bin/codesign "$@"
