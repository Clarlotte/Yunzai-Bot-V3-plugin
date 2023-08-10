/*
 * @FilePath: GroupAlter.js
 * @Author: Clarlotte
 * @Date: 2023-07-21 14:27:35
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-08-10 13:00:00
 * Copyright: 2023 xxxTech CO.,LTD. All Rights Reserved.
 * @Descripttion: 
 */
import plugin from '../../lib/plugins/plugin.js'
import path from 'path'
import fs from 'fs';
import yaml from 'js-yaml'
import { segment } from 'oicq';
import bottomBar from 'inquirer/lib/ui/bottom-bar.js';

let pathAddr = process.cwd().replace(/\\/g, '/')

//await init()

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
        console.log(gainType + '---------' + e.user_id + '---------' + e.group_id)
        if (!fs.readdirSync(this.dirPath, 'utf-8').includes(e.group_id + '.yaml')) {
            let groupPath = this.dirPath + '/' + this.e.group_id + '.yaml'
            let Data = {
                //头衔违禁词
                titleArr: [],
                //发言违禁词
                speakArr: [],
                //群管列表（权限最大，默认首次登陆机器人时设置的主人）
                groupmaster: masterQQ,
                //管理列表（仅次于上面的）
                master: [],
                //禁言时长（默认5分钟）
                time: 300,
                //群发言时间戳，用来第二天刷新群发言，进退群数据
                timestamp: timestamp,
                //群成员变动时间戳，用来刷新进退群人数数据
                grouptimestamp: grouptimestamp,
                //群禁言提醒开关
                groupnotice: true,
                //群发言数据
                data: 1,
                //进群数据
                increase: 0,
                //退群数据
                decrease: 0,
            }
            fs.writeFileSync(groupPath, yaml.dump(Data), 'utf-8')
        }
        // console.log(e)
        if (gainType == ('increase' || 'decrease')) {
            let groupcfg = new YamlReader(pathAddr + '/plugins/example/lzy/' + e.group_id + '.yaml', true)
            let data = groupcfg.get(gainType)
            if (groupcfg.get('timestamp') == Number(timestamp)) {
                groupcfg.set(gainType, data + 1)
            } else {
                groupcfg.set('timestamp', timestamp)
                groupcfg.set(gainType, 1)
            }
        }
        else if (gainType == 'ban') {
            let groupcfg = new YamlReader(pathAddr + '/plugins/example/lzy/' + e.group_id + '.yaml', true)
            if (groupcfg.get('groupnotice'))
                if (e.duration != 0) {
                    let msg = [
                        segment.at(e.user_id),
                        `你已被管理员`,
                        segment.at(e.operator_id),
                        `禁言`
                    ]
                    Bot.pickGroup(e.group_id).sendMsg(msg)
                }
                else if (e.duration == 0) {
                    let msg = [
                        segment.at(e.user_id),
                        `你已被管理员`,
                        segment.at(e.operator_id),
                        `解除禁言`
                    ]
                    Bot.pickGroup(e.group_id).sendMsg(msg)
                }
        }
    }
}
