; Runs inside the uninstaller. If the customer is on a free trial (or their trial already ended)
; and has not bought, put their PC back the way it was before the app is removed — otherwise
; uninstalling would be a way to keep the tweaks for free. A paying customer's tweaks are left alone.
; Skipped for auto-updates, which run the old uninstaller with --updated.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    DetailPrint "Reverting trial tweaks..."
    ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --uninstall-revert' $0
  ${endIf}
!macroend
