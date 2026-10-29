/**
 * Oiyo 路径配置
 */
export interface OiyoConfigDir {
  /**
   * 主包目录
   * @default '<srcDir>/pages'
   */
  mainPackage?: string;
  /**
   * 子包目录列表
   * @default '<srcDir>/packages/{root}/pages'
   */
  subPackages?: string[];
  /**
   * 布局目录
   * @default '<srcDir>/layouts'
   */
  layouts?: string;
}

/**
 * IDE 配置路径平台
 */
export interface IDEPlatformPath {
  weixin?: string;
}

/**
 * IDE 配置
 */
export interface OiyoConfigIDE {
  /**  构建小程序平台时自动打开对应 IDE */
  open?: boolean;
  /** 不同平台 IDE 的可执行路径 */
  path?: IDEPlatformPath;
}

/**
 * Oiyo 配置
 */
export interface OiyoConfig {
  /**
   * 项目根目录
   */
  rootDir?: string;
  /**
   * 源码目录
   */
  srcDir?: string;
  /**
   * 目录配置
   */
  dir?: OiyoConfigDir;
  /**
   * 忽略参与 oiyo 系统的文件（glob 模式）
   */
  exclude?: string[];
  /**
   * 小程序 IDE 配置
   * @experimental 自动打开小程序IDE
   */
  ide?: OiyoConfigIDE;
}
