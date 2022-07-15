import {
  AppConfiguration,
  AppConfigurationContextNamespace,
  saveAppConfig,
} from "@app/context/app-configuration"
import { useContext } from "react"

export const useAppConfig = () => {
  const { appConfig, setAppConfig } = useContext(AppConfigurationContextNamespace)

  const setAndSaveConfig = (config: AppConfiguration) => {
    setAppConfig(config)
    saveAppConfig(config)
  }

  const toggleUsdDisabled = () =>
    setAndSaveConfig({ ...appConfig, isUsdDisabled: !appConfig.isUsdDisabled })

  return { appConfig, toggleUsdDisabled, setAppConfig }
}
