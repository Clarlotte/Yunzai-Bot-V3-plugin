/*
 * @FilePath: GroupAlter.js
 * @Author: Clarlotte
 * @Date: 2023-07-21 14:27:35
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-07-22 07:42:11
 * Copyright: 2023 xxxTech CO.,LTD. All Rights Reserved.
 * @Descripttion: 
 */
import plugin from '../../lib/plugins/plugin.js'
import path from 'path'
import fs from 'fs';
import yaml from 'js-yaml'

let pathAddr = process.cwd().replace(/\\/g, '/')

let YamlReader = await import('./lzy/config.js')
YamlReader = YamlReader.default

let config = new YamlReader(pathAddr + '/plugins/example/lzy/config.yaml', true)
export class groupSetting extends plugin {
    dirPath = path.resolve('./plugins/example/lzy')

    constructor() {
        super({
            name: '群成员变动',
            dsc: '群成员变动',
            event: 'notice.group',
            priority: 5,
        })
    }

    async accept(e) {
        let date = new Date()
        let timestamp = date.getDate()
        let gainType = e.sub_type
        console.log("---------------------" + gainType, e.user_id + '---------------' + e.group_id)
        if (!fs.readdirSync(this.dirPath, 'utf-8').includes(e.group_id + '.yaml')) {
            let groupPath = this.dirPath + '/' + this.e.group_id + '.yaml'
            let Data = {
                titleArr: [],
                speakArr: [],
                groupmaster: [],
                master: [],
                time: 300,
                timestamp: timestamp,
                data: 1,
                increase: 0,
                decrease: 0,
            }
            fs.writeFileSync(groupPath, yaml.dump(Data), 'utf-8')
        }
        if (gainType != ('increase' || 'decrease')) return false
        let groupcfg = new YamlReader(pathAddr + '/plugins/example/lzy/' + e.group_id + '.yaml', true)
        let data = groupcfg.get(gainType)
        if (groupcfg.get('timestamp') == Number(timestamp)) {
            groupcfg.set(gainType, ++data)
        } else {
            groupcfg.set('timestamp', timestamp)
            groupcfg.set('data', 1)
        }
    }
}