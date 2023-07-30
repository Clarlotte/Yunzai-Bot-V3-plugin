/**
****************************************************************************************
 * @FilePath: GroupSetting.js
 * @Author: Clarlotte
 * @Date: 2023-07-22 05:39:31
 * @LastEditors: 
 * @LastEditTime: 2023-07-22 05:39:32
 * @Copyright: 2023 xxxTech CO.,LTD. All Rights Reserved.
 * @Descripttion: 
****************************************************************************************
*/
import plugin from '../../lib/plugins/plugin.js'
import cfg from '../../lib/config/config.js'
import { segment } from 'oicq'
import fs from 'fs';
import path from 'path'
import yaml from 'js-yaml'

let pathAddr = process.cwd().replace(/\\/g, '/')

//await init()

let YamlReader = await import('./lzy/config.js')
YamlReader = YamlReader.default

let masterQQ = cfg.masterQQ[0]

let config = new YamlReader(pathAddr + '/plugins/example/lzy/config.yaml', true)

export class groupSetting extends plugin {
    dirPath = path.resolve('./plugins/example/lzy')

    constructor() {
        super({
            name: '群管插件重构版',
            dsc: '群管插件重构版',
            event: 'message',
            priority: -1,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^我要头衔(.+)$',
                    /** 执行方法 */
                    fnc: 'Give_Title',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^撤销头衔(.*?)',
                    /** 执行方法 */
                    fnc: 'Repeal_Title',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^我不想要头衔了',
                    /** 执行方法 */
                    fnc: 'Cancel_Title',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^设置管理(.*?)',
                    /** 执行方法 */
                    fnc: 'setAdmin',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^撤销管理(.*?)',
                    /** 执行方法 */
                    fnc: 'repealAdmin',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^踢(.*?)',
                    /** 执行方法 */
                    fnc: 'kickGroupMember',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^(添加|删除)(头衔违禁词|发言违禁词)(.+)$',
                    /** 执行方法 */
                    fnc: 'modify',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^(删除|添加)群管([0-9]+)$',
                    /** 执行方法 */
                    fnc: 'setGroupMaster',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^设置禁言时长([0-9]*)$',
                    /** 执行方法 */
                    fnc: 'setTime',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^今日发言数据$',
                    /** 执行方法 */
                    fnc: 'speechData',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^今日入群数据$',
                    /** 执行方法 */
                    fnc: 'increaseData',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^今日退群数据$',
                    /** 执行方法 */
                    fnc: 'decreaseData',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^.*$',
                    /** 执行方法 */
                    fnc: 'punishment',
                    log: false
                },
                {
                    /** 命令正则匹配 */
                    reg: '^(删除|添加)(群)([0-9]+)$',
                    /** 执行方法 */
                    fnc: 'addGroupManage',
                    log: false
                },
            ]
        })
    }

    async getList(key, groupcfg) {
        return groupcfg.get(key)
    }

    async getGroupYaml(group_id) {
        let date = new Date()
        let timestamp = date.getDate()
        if (!fs.readdirSync(this.dirPath, 'utf-8').includes(group_id + '.yaml')) {
            let groupPath = this.dirPath + '/' + group_id + '.yaml'
            let Data = {
                //头衔违禁词
                titleArr: [],
                //发言违禁词
                speakArr: [],
                //群管列表（权限最大）
                groupmaster: [],
                //管理列表（仅次于上面的）
                master: [],
                //禁言时长（默认5分钟）
                time: 300,
                //时间戳，用来第二天刷新群发言，进退群数据
                timestamp: timestamp,
                //群发言数据
                data: 1,
                //进群数据
                increase: 0,
                //退群数据
                decrease: 0,
            }
            fs.writeFileSync(groupPath, yaml.dump(Data), 'utf-8')
        }
        let groupcfg = new YamlReader(pathAddr + '/plugins/example/lzy/' + group_id + '.yaml', true)
        return groupcfg
    }

    async Give_Title(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        await this.punishment(e)
        let flag = true
        let reg = new RegExp('^我要头衔(.+)$')
        let title = reg.exec(e.msg)[1]
        console.log('---------' + title)
        let groupcfg = await this.getGroupYaml(e.group_id)
        let time = Number(groupcfg.get('time'))
        if (e.group.is_owner) {
            if (title.length > 6 || title.length <= 0) {
                e.reply(`头衔最大长度为6，请重新输入`, true)
                return true
            } else {
                if (groupcfg.get('titleArr')) {
                    if (groupcfg.get('titleArr').some(item => e.msg.includes(item))) {
                        e.group.recallMsg(e.message)
                        e.group.muteMember(e.user_id, time)
                        flag = false
                        e.group.setTitle(e.user_id, '')
                        let msg = [
                            segment.at(e.user_id),
                            `你申请的头衔中包含违禁词，你将被禁言${time / 60}分钟，并回收你目前的头衔,有疑问请联系群主`,
                        ]
                        e.reply(msg)
                        return true
                    }
                }
            }
            if (flag) {
                e.group.setTitle(e.user_id, title)
                e.reply(`已为你成功将头衔设置为${title}`, true)
                return true
            }
        } else {
            e.reply(`我不是群主，无法对头衔进行操作`, true);
            return true
        }

    }

    async Repeal_Title(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        if (!e.group.is_owner) return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('groupmaster').some(item => item == Number(e.group_id)) || groupcfg.get('master').some(item => item == Number(e.group_id))) {
            let qq = null
            for (let msg of e.message) {
                if (msg.type == 'at') {
                    qq = msg.qq
                    break
                }
            }
            e.group.setTitle(qq, '')
            e.reply(`头衔已撤销成功`, true)
        }
    }

    //自行撤销头衔
    async Cancel_Title(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        if (!e.group.is_owner) return false
        await this.punishment(e)
        e.group.setTitle(e.user_id, '');
        e.reply(`头衔撤销成功了`, true);
    }

    async setAdmin(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        } await this.punishment(e)
        if (!e.group.is_owner) return false
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('groupmaster').includes(e.user_id)) {
            let qq = null
            for (let msg of e.message) {
                if (msg.type == 'at') {
                    qq = msg.qq
                    break
                }
            }
            if (qq == null) {
                e.reply(`未指定需要设置管理的对象`, true);
            } else {
                if (e.group.pickMember(qq).is_admin) {
                    e.reply(`此人已经是本群的管理了，无法再次设置`, true)
                } else {
                    e.group.setAdmin(qq, 1)
                    let remsg = [
                        `已经成功将`,
                        segment.at(qq),
                        `设置为本群管理了`,
                    ];
                    e.reply(remsg, true);
                }
            }
        }
    }

    //撤销管理
    async repealAdmin(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        await this.punishment(e)
        if (!e.group.is_owner) return false
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (config.get('group').includes(e.group_id)) {
            if (groupcfg.get('master').includes(e.user_id)) {
                let qq = null
                for (let msg of e.message) {
                    if (msg.type == 'at') {
                        qq = msg.qq
                        break
                    }
                }
                if (qq == null) {
                    msg.reply(`未指定需要撤销管理的对象`, true);
                } else {
                    if (e.group.pickMember(qq).is_admin) {
                        e.group.setAdmin(qq, 0)
                        let remsg = [
                            `已经成功将`,
                            segment.at(qq),
                            `的管理撤销了`,
                        ];
                        e.reply(remsg, true)
                        return true
                    } else {
                        e.reply(`此人并不是本群的管理，无法进行撤销`, true)
                    }
                }
            }
        }
    }

    //踢群成员
    async kickGroupMember(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        console.log(e.group.is_admin + '-----------' + e.group.is_owner)
        if (!e.group.is_admin && !e.group.is_owner)
            return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('master').includes(e.group_id)) {
            let kick_qq = null
            for (let msg of e.message) {
                if (msg.type == 'at') {
                    kick_qq = msg.qq
                    break
                }
            }
            let nickname = await (e.group.pickMember(kick_qq).nickname || e.group.pickMember(kick_qq).card)
            if (kick_qq == null) {
                e.reply(`未指定需要踢出的对象`);
            } else {
                e.group.kickMember(kick_qq);
                e.reply(`已经成功将${nickname}(${kick_qq})踢出本群`, true);
            }
        } else {
            e.reply(`你无权进行此操作`, true)
        }

    }

    //添加或删除违禁词
    async modify(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('master').includes(e.user_id))
            return false
        let reg = new RegExp('^(添加|删除)(头衔违禁词|发言违禁词)(.+)$')
        let option = reg.exec(e.msg)[1]
        let checkWord = reg.exec(e.msg)[2]
        let value = reg.exec(e.msg)[3]
        console.log(option + '---------' + checkWord + '------------' + value)
        let checkList = ['头衔违禁词', '发言违禁词',]
        let titleList = ['titleArr', 'speakArr',]
        let msg = [`${checkWord}列表:\n`]
        for (let i = 0; i < checkList.length; i++) {
            if (checkWord == checkList[i]) {
                if (option == '添加') {
                    if (groupcfg.get(titleList[i]).includes(value)) {
                        e.reply(`该违禁词已存在`)
                        break
                    }
                    let arr = groupcfg.get(titleList[i])
                    if (Array.isArray(arr)) {
                        arr.push(value)
                    } else {
                        arr = [value]
                    }
                    console.log(titleList[i])
                    groupcfg.set(titleList[i], arr)
                } else {
                    let arr = groupcfg.get(titleList[i])
                    if (Array.isArray(arr)) {
                        for (let j = 0; j < arr.length; j++) {
                            if (arr[j] == value) {
                                arr.splice(j, 1)
                                groupcfg.set(titleList[i], arr)
                                break
                            }
                        }
                    }
                }
            }
        }
        for (let i = 0; i < checkList.length; i++) {
            if (checkWord == checkList[i]) {
                let arr = await this.getList(titleList[i], groupcfg)
                if (Array.isArray(arr) && arr.length != 0) {
                    msg.push(arr.join('\n'))
                } else {
                    msg.push('无')
                }
                break
            }
        }
        e.reply(msg)
        return true
    }

    async setGroupMaster(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        await this.punishment(e)
        if (groupcfg.get('groupmaster').includes(e.user_id))
            return false
        let groupcfg = await this.getGroupYaml(e.group_id)
        let reg = new RegExp('^(添加|删除)(群管)([0-9]+)$')
        let option = reg.exec(e.msg)[0]
        let value = Number(reg.exec(e.msg)[1])
        let msg = [`群管列表:\n`]
        if (groupcfg.get('master').includes(e.group_id)) {
            if (e.isPrivate) {
                if (groupcfg.get('groupmaster').includes(value)) {
                    e.reply(`此人已在群管列表中，无需重复添加`, true)
                } else {
                    let arr = groupcfg.get('group')
                    if (option == ('添加')) {
                        if (Array.isArray(arr)) {
                            arr.push(value)
                        } else {
                            arr = [value]
                        }
                        groupcfg.set('groupmaster', arr)
                    } else {
                        if (Array.isArray(arr))
                            for (let j = 0; j < arr.length; j++) {
                                if (arr[j] == value) {
                                    arr.splice(j, 1)
                                    groupcfg.set('groupmaster', arr)
                                    break
                                }
                            }
                    }
                    arr = await this.getList('groupmaster', groupcfg)
                    if (Array.isArray(arr) && arr.length != 0) {
                        msg.push(arr.join('\n'))
                    } else {
                        msg.push('无')
                    }
                    e.reply(msg)
                    return true
                }
            } else {
                e.reply(`请私聊进行操作!`, true)
            }
        }

    }

    //设置禁言时长
    async setTime(e) {
        if (!config.get('group').includes(e.group_id)) {
            let masterQQ = cfg.masterQQ[0]
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        if (groupcfg.get('master').includes(e.user_id))
            return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        let reg = new RegExp('^设置禁言时长([0-9]*)$')
        let time = Number(reg.exec(e.msg)[1])
        if (time % 60 != 0) {
            e.reply(`请输入能被60整除的整数`, true)
        } else {
            if (time == '')
                time = 600
            groupcfg.set('time', time)
            e.reply(`已成功将禁言时长修改为${time / 60}分钟`, true)
        }
    }

    //发言检测
    async punishment(e) {
        if (!config.get('group').includes(e.group_id)) return false
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (config.get('auto')) {
            if (e.group.pickMember(e.user_id).is_owner) {
                let arr = groupcfg.get('groupmaster')
                if (groupcfg.get('groupmaster').includes(e.user_id)) {
                    return true
                } else {
                    if (Array.isArray(arr)) {
                        arr.push(e.user_id)
                    } else {
                        arr = [e.user_id]
                    }
                    groupcfg.set('groupmaster', arr)
                    groupcfg.set('master', arr)
                }
            }
            if (e.group.pickMember(e.user_id).is_admin) {
                let arr = groupcfg.get('master')
                if (groupcfg.get('master').includes(e.user_id)) {
                    return true
                } else {
                    if (Array.isArray(arr)) {
                        arr.push(e.user_id)
                    } else {
                        arr = [e.user_id]
                    }
                    groupcfg.set('master', arr)
                }
            }
        }
        let date = new Date()
        let timestamp = date.getDate()
        let data = Number(groupcfg.get('data'))
        if (groupcfg.get('timestamp') == Number(timestamp)) {
            groupcfg.set('data', ++data)
        } else {
            groupcfg.set('timestamp', timestamp)
            groupcfg.set('data', 1)
        }
        if (groupcfg.get('speakArr')) {
            //检测消息中是否包含违禁词
            if (groupcfg.get('speakArr').some(item => e.msg.includes(item))) {
                if (groupcfg.get('master').includes(e.user_id) || groupcfg.get('groupmaster').includes(e.user_id)) {
                    return true
                } else {
                    e.group.recallMsg(e.msg)
                    e.group.muteMember(e.user_id, time)
                    let msg = [
                        segment.at(e.user_id),
                        `由于你的发言中存在违禁词，你将被禁言${time / 60}分钟`
                    ]
                    e.reply(msg)
                }
            }
        }
    }

    async speechData(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        let data = groupcfg.get('data')
        e.reply(`今日发言数据：${data}条`)
    }

    async increaseData(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        let date = new Date()
        let timestamp = date.getDate()
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('timestamp') != timestamp) {
            groupcfg.set('increase', 0)
        }
        let data = groupcfg.get('increase')
        e.reply(`今日入群数据：${data}人`)
    }

    async decreaseData(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`, true)
            return false
        }
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('timestamp') != timestamp) {
            groupcfg.set('increase', 0)
        }
        let data = groupcfg.get('decrease')
        e.reply(`今日退群数据：${data}人`)
    }

    //以下操作仅支持Bot主人
    async addGroupManage(e) {
        let reg = new RegExp('^(删除|添加)群([0-9]+)$')
        let option = reg.exec(e.msg)[1]
        console.log()
        let value = Number(reg.exec(e.msg)[2])
        console.log(option + '-----------------' + value)
        let msg = [`群列表:\n`]
        if (cfg.masterQQ.includes(e.user_id)) {
            if (e.isPrivate) {
                let arr = config.get('group')
                if (option == '添加') {
                    if (config.get('group').includes(value)) {
                        e.reply(`此群已在列表中，无需重复添加`)
                    } else {
                        if (Array.isArray(arr)) {
                            arr.push(value)
                        } else {
                            arr = [value]
                        }
                        config.set('group', arr)
                    }
                } else {
                    if (Array.isArray(arr))
                        for (let j = 0; j < arr.length; j++) {
                            if (arr[j] == value) {
                                arr.splice(j, 1)
                                config.set('group', arr)
                                break
                            }
                        }
                }
                arr = await this.getList('group', config)
                if (Array.isArray(arr) && arr.length != 0) {
                    msg.push(arr.join('\n'))
                } else {
                    msg.push('无')
                }
                e.reply(msg)
                return true

            } else {
                e.reply(`请私聊进行操作`, true)
            }
        }
    }
}