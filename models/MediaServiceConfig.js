// models/MediaServiceConfig.js - 媒体服务配置模型
class MediaServiceConfig {
    constructor(host, port, protocol = 'https', webrtcPort = null, apiPort = null) {
        this.host = host;
        this.port = port;
        this.protocol = protocol;
        this.webrtcPort = webrtcPort || port;
        this.apiPort = apiPort || port;
        this.createdAt = new Date();
    }
    
    getSignalingUrl() {
        return `${this.protocol}://${this.host}:${this.port}`;
    }
    
    getWebRTCUrl() {
        return `${this.protocol}://${this.host}:${this.webrtcPort}`;
    }
    
    getApiUrl() {
        return `${this.protocol}://${this.host}:${this.apiPort}`;
    }
    
    toJSON() {
        return {
            host: this.host,
            port: this.port,
            protocol: this.protocol,
            webrtcPort: this.webrtcPort,
            apiPort: this.apiPort,
            signalingUrl: this.getSignalingUrl(),
            webrtcUrl: this.getWebRTCUrl(),
            apiUrl: this.getApiUrl(),
            createdAt: this.createdAt
        };
    }
    
    // 验证配置是否有效
    static validate(config) {
        if (!config) {
            return { valid: false, error: '媒体服务配置不能为空' };
        }
        
        const { host, port } = config;
        
        if (!host || typeof host !== 'string' || host.trim().length === 0) {
            return { valid: false, error: '媒体服务主机地址不能为空' };
        }
        
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return { valid: false, error: '媒体服务端口无效' };
        }
        
        return {
            valid: true,
            config: new MediaServiceConfig(
                host.trim(),
                portNum,
                config.protocol || 'https',
                config.webrtcPort || portNum,
                config.apiPort || portNum
            )
        };
    }
}

module.exports = MediaServiceConfig;