import { configurePlatform } from './Platform/PlatformIO'
import { NodePlatformIO } from './Platform/NodePlatformIO'

configurePlatform(new NodePlatformIO())

export * from './index'
