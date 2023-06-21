/*
 * @FilePath: groupSetting_react.js
 * @Author: Clarlotte
 * @Date: 2023-06-20 19:29:39
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-06-21 21:37:23
 * Copyright: 2023 xxxTech CO.,LTD. All Rights Reserved.
 * @Descripttion: 
 */
import plugin from '../../lib/plugins/plugin.js'
import common from '../../lib/common/common.js'
import { segment } from 'oicq'
import lodash from 'lodash'
import cfg from '../../lib/config/config.js'
import fs from 'fs';
import YAML from "yaml";

let path = process.cwd().replace(/\\/g, '/')

//await init()

let YamlReader = await import('../../resources/lzy/config.js')
YamlReader = YamlReader.default

let config = new YamlReader(path + '/resources/lzy/config.yaml', true)

export class example extends plugin {
    constructor() {
        super({
            name: '群管插件重构版',
            dsc: '群管插件重构版',
            event: 'message',
            priority: 1001,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#我要头衔(.+)$',
                    /** 执行方法 */
                    fnc: 'Give_Title',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#撤销头衔(.*?)',
                    /** 执行方法 */
                    fnc: 'Repeal_Title',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#我不想要头衔了',
                    /** 执行方法 */
                    fnc: 'Cancel_Title',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#设置管理(.*?)',
                    /** 执行方法 */
                    fnc: 'setAdmin',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#撤销管理(.*?)',
                    /** 执行方法 */
                    fnc: 'repealAdmin',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#踢(.*?)',
                    /** 执行方法 */
                    fnc: 'kickGroupMember',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#(设置|删除)(头衔违禁词|发言违禁词)(.+)$',
                    /** 执行方法 */
                    fnc: 'modify',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#设置群管([0-9]+)$',
                    /** 执行方法 */
                    fnc: 'setGroupManage',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#设置禁言时长([0-9]*)$',
                    /** 执行方法 */
                    fnc: 'setTime',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^.*$',
                    /** 执行方法 */
                    fnc: 'punishment',
                    log: false
                },
            ]
        })
    }

    async getList(key) {
        return config.get(key)
    }

    //给予头衔
    async Give_Title(e) {
        console.log(e)
        let flag = true
        let reg = new RegExp('#我要头衔(.+)$')
        let title = reg.exec(e.msg)[1]
        let time = Number(config.get('time'))
        if (config.get('group')) {
            if (config.get('group').some(item => item == Number(e.group_id))) {
                if (e.group.is_owner) {
                    if (title.length > 6 || title.length <= 0) {
                        e.reply(`头衔最大长度为6，请重新输入`, true)
                        return true
                    } else {
                        if (config.get('titleArr')) {
                            if (config.get('titleArr').some(item => e.msg.includes(item))) {
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
        }
    }

    //撤销头衔
    async Repeal_Title(e) {
        if (config.get('master')) {
            if (config.get('master').some(item => item == Number(e.user_id))) {
                if (config.get('group')) {
                    if (config.get('group').some(item => item == Number(e.group_id))) {
                        let qq = null
                        for (let msg of e.message) {
                            if (msg.type == 'at') {
                                qq = msg.qq
                                break
                            }
                        }
                        if (e.group.is_owner) {
                            e.group.setTitle(qq, '')
                            e.reply(`头衔已撤销成功`, true)
                        } else {
                            e.reply(`我不是群主，无法对头衔进行操作`, true)
                        }
                    }
                }
            }
        }
    }

    //自行撤销头衔
    async Cancel_Title(e) {
        e.group.setTitle(e.user_id, '');
        e.reply(`头衔撤销成功了`, true);
        return true;
    }

    //设置管理
    async setAdmin(e) {
        if (config.get('master')) {
            if (config.get('master').some(item => item == Number(e.user_id))) {
                if (config.get('group')) {
                    if (config.get('group').some(item => item == Number(e.group_id))) {
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
            }
        }
    }

    //撤销管理
    async repealAdmin(e) {
        if (config.get('master')) {
            if (config.get('master').some(item => item == Number(e.user_id))) {
                if (config.get('group')) {
                    if (config.get('group').some(item => item == Number(e.group_id))) {
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
        }
    }
    //踢群成员
    async kickGroupMember(e) {
        if (config.get('master')) {
            if (config.get('master').some(item => item == Number(e.user_id))) {
                if (config.get('group')) {
                    if (config.get('group').some(item => item == Number(e.group_id))) {
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
                    }
                }
            }
        }
    }

    //添加或删除违禁词
    async modify(e) {
        if (config.get('master')) {
            if (config.get('master').some(item => item != Number(e.user_id))) {
                return false
            }
        }
        let reg = new RegExp('#(设置|删除)(头衔违禁词|发言违禁词)(.+)$')
        let option = reg.exec(e.msg)[1]
        let checkWord = reg.exec(e.msg)[2]
        let value = reg.exec(e.msg)[3]
        let checkList = ['头衔违禁词', '发言违禁词',]
        let titleList = ['titleArr', 'speakArr',]
        let msg = [`${checkWord}列表:\n`]
        for (let i = 0; i < checkList.length; i++) {
            if (checkWord == checkList[i]) {
                if (option == '设置') {
                    let arr = config.get(titleList[i])
                    if (Array.isArray(arr)) {
                        arr.push(value)
                    } else {
                        arr = [value]
                    }
                    config.set(titleList[i], arr)
                } else {
                    let arr = config.get(titleList[i])
                    if (Array.isArray(arr)) {
                        for (let j = 0; j < arr.length; j++) {
                            if (arr[j] == value) {
                                arr.splice(j, 1)
                                config.set(titleList[i], arr)
                                break
                            }
                        }
                    }
                }
                let arr = await this.getList(titleList[i])
                if (Array.isArray(arr)) {
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

    //添加群管
    async setGroupManage(e) {
        let reg = new RegExp('#(设置|添加)(群管)([0-9]+)$')
        let option = reg.exec(e.msg)[1]
        let value = Number(reg.exec(e.msg)[3])
        let msg = [`群管列表:\n`]
        if (config.get('master')) {
            if (config.get('master').some(item => item == Number(e.user_id))) {
                if (e.isPrivate) {
                    if (config.get('group')) {
                        if (config.get('group').some(item => item == value)) {
                            e.reply(`此群已在列表中，无需重复添加`)
                        } else {
                            let arr = config.get('group')
                            if (option == '设置') {
                                if (Array.isArray(arr)) {
                                    arr.push(value)
                                } else {
                                    arr = [value]
                                }
                                config.set('group', arr)
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
                            arr = await this.getList('group')
                            if (Array.isArray(arr)) {
                                msg.push(arr.join('\n'))
                            } else {
                                msg.push('无')
                            }
                            e.reply(msg)
                            return true
                        }
                    }
                } else {
                    e.reply(`请私聊进行操作!`)
                }
            }
        }
    }

    //设置禁言时长
    async setTime(e) {
        let reg = new RegExp('#设置禁言时长([0-9]*)$')
        let time = Number(reg.exec(e.msg)[1])
        if (time % 60 != 0) {
            e.reply(`请输入能被60整除的整数`, true)
        } else {
            if (time == '')
                time = 600
            config.set('time', time)
            e.reply(`已成功将禁言时长修改为${time / 60}分钟`, true)
        }
    }

    //发言检测
    async punishment(e) {
        let time = Number(config.get('time'))
        if (config.get('group')) {
            if (config.get('group').some(item => item == Number(e.group_id))) {
                if (config.get('speakArr')) {
                    //检测消息中是否包含违禁词
                    if (config.get('speakArr').some(item => e.msg.includes(item))) {
                        if (config.get('master')) {
                            if (config.get('master').some(item => item == Number(e.user_id))) {
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
            }
        }
    }
}
