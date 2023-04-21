import info from './satellite_info.json';

// 读取JSON数据并转为Map对象
const satelliteInfo = new Map<string, any>(Object.entries(info));

/**
 * 获取对应的Norad ID卫星的详细数据
 * @param noradID
 * @return 存在返回obj对象，不存在则返回null
 */
export function getSatelliteInfo(noradID: string) {
    const detail = satelliteInfo.get(noradID);
    if (!detail) return null;
    detail['Norad ID'] = noradID;
    return detail;
}

/**
 * 获取对应的Norad ID卫星的Description描述
 * @param noradID
 * @return 描述文本信息，可以直接赋值给entity.description，不存在则返回不存在信息
 */
export function getSatelliteDescription(noradID: string): string {
    const detail = getSatelliteInfo(noradID);
    if (!detail) return `No Such Satellite (Norad ID = ${noradID}) !`;
    let description = "";
    Object.entries(detail).forEach(entry => {
        description += `
            <div style="display: flex; flex-direction: row; border-bottom: 2px solid #95a5a6; padding: 5px">
                <div style="flex: 1; color: #2980b9; font-weight: bold">${entry[0]}</div>
                <div style="flex: 1; color: white; text-align: end">${entry[1]}</div>
            </div>
        `;
    });
    return description;
}
