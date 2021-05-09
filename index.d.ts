interface IConfig {
  path: string // 复制路径
  hooks: IHooks // 钩子
}
interface IHooks {
  /**
   * seed 包启动时回调函数
   * @param op op.env - cmd 参数;
   * @param op op.targetPath 初始化路径;
   */
  beforeStart(op: IHookStartOption): Promise<any>
  /**
   * seed 包复制前回调函数
   * @param op op.env - cmd 参数;
   * @param op op.targetPath 初始化路径;
   * @param op op.fileMap 复制 map;
   */
  beforeCopy(op: IHookCopyOption): Promise<IFileMap>
  /**
   * seed 包复制后回调函数
   * @param op op.env - cmd 参数;
   * @param op op.targetPath 初始化路径;
   * @param op op.fileMap 复制 map;
   */
  afterCopy(op: IHookCopyOption): Promise<any> 
}

interface IHookStartOption {
  env: IEnv // cmd 参数
  targetPath: string // 初始化路径
}

interface IHookCopyOption {
  fileMap: IFileMap,
  targetPath: string, // 初始化路径
  env: IEnv
}

interface IEnv {
  type?: string // 类型
}
interface IFileMap {
  [orgPath: string]: string[] // 拷贝map
}


declare const config: IConfig;

export = config;