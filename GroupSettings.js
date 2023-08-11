import plugin from '../../lib/plugins/plugin.js'
import cfg from '../../lib/config/config.js'
import common from '../../lib/common/common.js'
import { segment } from 'oicq'
import fs from 'fs';
import path from 'path'
import yaml from 'js-yaml'
import child_process from "child_process"
import os from 'os'
import _ from 'lodash'
import YAML from "yaml"

let pathAddr = process.cwd().replace(/\\/g, '/')

//await init()

let YamlReader = await import('./config/config.js')
YamlReader = YamlReader.default

let masterQQ = cfg.masterQQ[0]

let config = new YamlReader(pathAddr + '/plugins/example/config/config.yaml', true)

export class groupSetting extends plugin {
    dirPath = path.resolve('./plugins/example/config')

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
                    reg: '^#踢(.*?)',
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
                    reg: '^(添加|删除)群管([0-9]+)$',
                    /** 执行方法 */
                    fnc: 'setGroupMaster',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^设置禁言时长([0-9]+)(分|时|天)$',
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
                    reg: '^设置群禁言提醒(开启|关闭)$',
                    /** 执行方法 */
                    fnc: 'groupNotice',
                },
                {
                    reg: '^系统状态$',
                    fnc: 'systemStatus',
                },
                {
                    reg: '^(添加|删除)入群验证答案(.+)$',
                    fnc: 'groupComment',
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
        let grouptimestamp = date.getDate()
        if (!fs.readdirSync(this.dirPath, 'utf-8').includes(group_id + '.yaml')) {
            let groupPath = this.dirPath + '/' + group_id + '.yaml'
            let Data = {
                //头衔违禁词
                titleArr: [],
                //发言违禁词
                speakArr: [],
                //群管列表（权限最大，默认首次登陆机器人时设置的主人）
                groupmaster: [masterQQ,],
                //管理列表（仅次于上面的）
                master: [],
                //入群验证
                comment: [],
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
        let groupcfg = new YamlReader(pathAddr + '/plugins/example/config/' + group_id + '.yaml', true)
        return groupcfg
    }

    async getFileSize(size, isByte = true, isSuffix = true) { // 把字节转换成正常文件大小
        if (size == null || size == undefined) return 0
        let num = 1024.00 // byte
        if (isByte && size < num) {
            return size.toFixed(2) + 'B'
        }
        if (size < Math.pow(num, 2)) {
            return (size / num).toFixed(2) + `K${isSuffix ? 'b' : ''}`
        } // kb
        if (size < Math.pow(num, 3)) {
            return (size / Math.pow(num, 2)).toFixed(2) + `M${isSuffix ? 'b' : ''}`
        } // M
        if (size < Math.pow(num, 4)) {
            return (size / Math.pow(num, 3)).toFixed(2) + 'G'
        } // G
        return (size / Math.pow(num, 4)).toFixed(2) + 'T' // T
    }

    async formatTime(time, format, repair = true) {
        const second = parseInt(time % 60)
        const minute = parseInt((time / 60) % 60)
        const hour = parseInt((time / (60 * 60)) % 24)
        const day = parseInt(time / (24 * 60 * 60))
        const timeObj = {
            day,
            hour: repair && hour < 10 ? `0${hour}` : hour,
            minute: repair && minute < 10 ? `0${minute}` : minute,
            second: repair && second < 10 ? `0${second}` : second
        }
        if (format == 'default') {
            let result = ''

            if (day > 0) {
                result += `${day}天`
            }
            if (hour > 0) {
                result += `${timeObj.hour}小时`
            }
            if (minute > 0) {
                result += `${timeObj.minute}分`
            }
            if (second > 0) {
                result += `${timeObj.second}秒`
            }
            return result
        }

        if (typeof format === 'string') {
            format = format
                .replace(/dd/g, day)
                .replace(/hh/g, timeObj.hour)
                .replace(/mm/g, timeObj.minute)
                .replace(/ss/g, timeObj.second)

            return format
        }

        if (typeof format === 'function') {
            return format(timeObj)
        }

        return timeObj
    }

    async Give_Title(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        await this.punishment(e)
        let flag = true
        let reg = new RegExp('^我要头衔(.+)$')
        let title = reg.exec(e.msg)[1]
        // console.log('---------' + title)
        let groupcfg = await this.getGroupYaml(e.group_id)
        let time = Number(groupcfg.get('time'))
        if (e.group.is_owner) {
            if (title.length > 6 || title.length <= 0) {
                e.reply(`头衔最大长度为6，请重新输入`)
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
                e.reply(`已为你成功将头衔设置为${title}`)
                return true
            }
        } else {
            e.reply(`我不是群主，无法对头衔进行操作`);
            return true
        }
        return true
    }

    async Repeal_Title(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        if (!e.group.is_owner) return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('groupmaster').includes(e.user_id)) {
            let qq = null
            for (let msg of e.message) {
                if (msg.type == 'at') {
                    qq = msg.qq
                    break
                }
            }
            e.group.setTitle(qq, '')
            e.reply(`头衔已撤销成功`)
        }
        return true
    }

    //自行撤销头衔
    async Cancel_Title(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        if (!e.group.is_owner) return false
        await this.punishment(e)
        e.group.setTitle(e.user_id, '');
        e.reply(`头衔撤销成功了`);
        return true
    }

    //设置管理
    async setAdmin(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        if (!e.group.is_owner) return false
        let qq = null
        for (let msg of e.message) {
            if (msg.type == 'at') {
                qq = msg.qq
                break
            }
        }
        if (qq == null) return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('groupmaster').includes(e.user_id)) {
            if (e.group.pickMember(qq).is_admin) {
                e.reply(`此人已经是本群的管理了，无法再次设置`)
            } else {
                e.group.setAdmin(qq, 1)
                let remsg = [
                    `已经成功将`,
                    segment.at(qq),
                    `设置为本群管理了`,
                ];
                e.reply(remsg);
            }
        }
        return true
    }

    //撤销管理
    async repealAdmin(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let qq = null
        for (let msg of e.message) {
            if (msg.type == 'at') {
                qq = msg.qq
                break
            }
        }
        if (qq == null) return false
        if (!e.group.is_owner) return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (config.get('group').includes(e.group_id)) {
            if (groupcfg.get('groupmaster').includes(e.user_id)) {
                if (e.group.pickMember(qq).is_admin) {
                    e.group.setAdmin(qq, 0)
                    let remsg = [
                        `已经成功将`,
                        segment.at(qq),
                        `的管理撤销了`,
                    ];
                    e.reply(remsg)
                } else {
                    e.reply(`此人并不是本群的管理，无法进行撤销`)
                }
            }
        }
        return true
    }

    //踢群成员
    async kickGroupMember(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        console.log(e.group.is_admin + '-----------' + e.group.is_owner)
        if (!e.group.is_admin && !e.group.is_owner)
            return false
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('master').includes(e.user_id)) {
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
                e.reply(`已经成功将${nickname}(${kick_qq})踢出本群`);
            }
        } else {
            e.reply(`你无权进行此操作`)
        }

    }

    //添加或删除违禁词
    async modify(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (!groupcfg.get('groupmaster').includes(e.user_id)) return false
        await this.punishment(e)
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
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (!groupcfg.get('groupmaster').includes(e.user_id))
            return false
        await this.punishment(e)
        let reg = new RegExp('^(添加|删除)群管([0-9]+)$')
        let option = reg.exec(e.msg)[1]
        let value = Number(reg.exec(e.msg)[2])
        let msg = [`群管列表:\n`]
        console.log(option + '------' + value)
        if (groupcfg.get('master').includes(value) && option == ('添加')) {
            e.reply(`此人已在群管列表中，无需重复添加`)
        } else {
            let arr = groupcfg.get('master')
            if (option == ('添加')) {
                if (Array.isArray(arr)) {
                    arr.push(value)
                } else {
                    arr = [value]
                }
                groupcfg.set('master', arr)
            } else {
                if (Array.isArray(arr))
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j] == value) {
                            arr.splice(j, 1)
                            groupcfg.set('master', arr)
                            break
                        }
                    }
            }
            arr = await this.getList('master', groupcfg)
            if (Array.isArray(arr) && arr.length != 0) {
                msg.push(arr.join('\n'))
            } else {
                msg.push('无')
            }
            e.reply(msg)
            // return true
        }
        return true
    }

    //设置禁言时长
    async setTime(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        if (!groupcfg.get('groupmaster').includes(e.user_id))
            return false
        let groupcfg = await this.getGroupYaml(e.group_id)
        await this.punishment(e)
        let reg = new RegExp('^设置禁言时长([0-9]+)(分|时|天)$')
        let time = Number(reg.exec(e.msg)[1])
        let option = reg.exec(e.msg)[2]
        console.log(e.group_id + '---------' + time + '--------' + option)
        if (time == '' && option == '') {
            time = 600
            groupcfg.set('time', time)
            e.reply(`已成功将禁言时长修改为10分钟`)
        }
        else if (option == '分') {
            time = time * 60
            groupcfg.set('time', time)
            e.reply(`已成功将禁言时长修改为${time}${option}`)
        }
        else if (option == '时') {
            time = time * 60 * 60
            groupcfg.set('time', time)
            e.reply(`已成功将禁言时长修改为${time}${option}`)

        }
        else if (option == '天') {
            time = time * 60 * 60 * 24
            groupcfg.set('time', time)
            e.reply(`已成功将禁言时长修改为${time}${option}`)

        }
        return true
    }

    //发言检测
    async punishment(e) {
        if (!config.get('group').includes(e.group_id)) return false
        let groupcfg = await this.getGroupYaml(e.group_id)
        let date = new Date()
        let timestamp = date.getDate()
        let data = Number(groupcfg.get('data'))
        let time = Number(groupcfg.get('time'))
        console.log(e.group_id + '--------------' + data)
        if (groupcfg.get('timestamp') == Number(timestamp)) {
            groupcfg.set('data', data + 1)
        } else {
            groupcfg.set('timestamp', timestamp)
            groupcfg.set('data', 1)
        }
        if (e.message[0]['type'] == 'text')
            if (groupcfg.get('speakArr')) {
                //检测消息中是否包含违禁词
                if (groupcfg.get('speakArr').some(item => e.msg.includes(item))) {
                    if (groupcfg.get('master').includes(e.user_id) || groupcfg.get('groupmaster').includes(e.user_id)) {
                        return true
                    } else {
                        console.log(e.msg)
                        e.group.recallMsg(e)
                        e.group.muteMember(e.user_id, time)
                        let msg = [
                            segment.at(e.user_id),
                            `由于你的发言中存在违禁词，你将被禁言${time / 60}分钟`
                        ]
                        e.reply(msg)
                    }
                }
            }
        return true
    }

    async speechData(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        let data = groupcfg.get('data')
        e.reply(`今日发言数据：${data}条`)
        return true
    }

    async increaseData(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let date = new Date()
        let timestamp = date.getDate()
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('grouptimestamp') != timestamp) {
            groupcfg.set('increase', 0)
            groupcfg.set('decrease', 0)
        }
        let data = groupcfg.get('increase')
        e.reply(`今日入群数据：${data}人`)
        return true
    }

    async decreaseData(e) {
        if (config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let date = new Date()
        let timestamp = date.getDate()
        await this.punishment(e)
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (groupcfg.get('grouptimestamp') != timestamp) {
            groupcfg.set('decrease', 0)
            groupcfg.set('increase', 0)
        }
        let data = groupcfg.get('decrease')
        e.reply(`今日退群数据：${data}人`)
        return true
    }

    async groupNotice(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (!groupcfg.get('groupmaster').includes(e.user_id))
            return false
        let reg = new RegExp('^设置群禁言提醒(开启|关闭)$')
        await this.punishment(e)
        let option = reg.exec(e.msg)[1]
        if (option == '开启') {
            groupcfg.set('groupnotice')
            e.reply(`群禁言提醒已开启`)
        }
        else if (option == '关闭') {
            groupcfg.set('groupnotice', false)
            e.reply(`群禁言提醒已关闭`)
        }
        return true
    }

    async systemStatus(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (!groupcfg.get('groupmaster').includes(e.user_id))
            return false
        try {
            this.si = await import('systeminformation')
            this.osInfo = await this.si.osInfo()
        } catch (error) {
            if (error.stack?.includes('Cannot find package')) {
                logger.warn('--------依赖缺失--------')
                logger.warn(`缺少依赖，如需使用此功能请运行：${logger.red('pnpm add systeminformation -w')}`)
                logger.warn('-----------------------')
                logger.debug(decodeURI(error.stack))
            } else {
                logger.error(`载入依赖错误：${logger.red('systeminformation')}`)
                logger.error(decodeURI(error.stack))
            }
        }
        await this.punishment(e)
        let cores = os.cpus()
        //内存使用率
        let MemUsage = (1 - os.freemem() / os.totalmem()).toFixed(2) * 100 + "%"
        // 总共内存
        let totalmem = await this.getFileSize(os.totalmem())
        // 使用内存
        let Usingmemory = await this.getFileSize((os.totalmem() - os.freemem()))
        //CPU制造者
        let cpuModel = cores[0]?.model.slice(0, cores[0]?.model.indexOf(' ')) || ''
        let cpuArch = await this.osInfo?.arch
        //系统运行时间
        let systime = await this.formatTime(os.uptime(), 'dd天hh小时mm分', false)
        let { currentLoad: { currentLoad }, cpuCurrentSpeed } = await this.si.get({
            currentLoad: 'currentLoad',
            cpuCurrentSpeed: 'max,avg'
        })
        child_process.exec("cat /etc/issue", function (error, stdout, stderr) {
            if (!error) {
                let msg = [
                    `系统版本：${stdout}(${os.platform()})\n`,
                    `CPU使用率：${Math.round(currentLoad) + '%'}(${cpuModel} ${cores.length}核 ${cpuArch})\n`,
                    `内存使用率：${MemUsage}(${Usingmemory}/${totalmem})\n`,
                    `系统运行时间：${systime}`,
                ]
                e.reply(msg)
            }
        })
    }

    async groupComment(e) {
        if (!config.get('group').includes(e.group_id)) {
            e.reply(`此群无权使用此机器人，请联系QQ${masterQQ}进行处理`)
            return false
        }
        let groupcfg = await this.getGroupYaml(e.group_id)
        if (!groupcfg.get('groupmaster').includes(e.user_id))
            return false
        let reg = new RegExp('^(添加|删除)入群验证答案(.+)$')
        let option = reg.exec(e.msg)[1]
        let comment = reg.exec(e.msg)[2]
        console.log(option + '--------' + comment)
        await this.punishment(e)
        let msg = ['入群验证：\n']
        if (groupcfg.get("comment").includes(comment) && option == '添加') {
            e.reply(`该关键词已存在，无需重复添加`)
        } else {
            let arr = groupcfg.get('comment')
            if (option == '添加') {
                if (Array.isArray(arr)) {
                    arr.push(comment)
                } else {
                    arr = [comment]
                }
                groupcfg.set('comment', arr)
            } else {
                if (Array.isArray(arr))
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j] == comment) {
                            arr.splice(j, 1)
                            groupcfg.set('comment', arr)
                            break
                        }
                    }
            }
            arr = await this.getList('comment', groupcfg)
            if (Array.isArray(arr) && arr.length != 0) {
                msg.push(arr.join('\n'))
            } else {
                msg.push('无')
            }
            e.reply(msg)
        }
        return true
    }

    //以下操作仅支持Bot主人
    async addGroupManage(e) {
        let reg = new RegExp('^(删除|添加)群([0-9]+)$')
        let option = reg.exec(e.msg)[1]
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
                e.reply(`请私聊进行操作`)
            }
        }
    }
}

export class groupAlter extends plugin {
    dirPath = path.resolve('./plugins/example/config')

    constructor() {
        super({
            name: '群成员变动',
            dsc: '群成员变动',
            event: 'notice.group',
            priority: -1,
        })
    }

    async accept(e) {
        if (!config.get('group').includes(e.group_id)) return false
        let date = new Date()
        let timestamp = date.getDate()
        let gainType = e.sub_type
        let operator_id = e.operator_id, user_id = e.user_id, group_id = e.group_id
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
        if ((e.sub_type == 'increase') || (e.sub_type == 'decrease')) {
            // console.log(e)
            let groupcfg = new YamlReader(pathAddr + '/plugins/example/config/' + e.group_id + '.yaml', true)
            let data = groupcfg.get(gainType)
            if (groupcfg.get('timestamp') == Number(timestamp)) {
                groupcfg.set(gainType, data + 1)
            } else {
                groupcfg.set('timestamp', timestamp)
                groupcfg.set(gainType, 1)
            }
            if (gainType == 'increase') {
                let msg = [
                    segment.at(e.user_id),
                    `欢迎加入${e.group_name}`
                ]
                Bot.pickGroup(e.group_id).sendMsg(msg)
            } else {
                if (operator_id == user_id) {
                    let { nickname } = await Bot.getStrangerInfo(user_id)
                    let msg = [
                        `退群通知：\n`,
                        `${nickname}(${user_id})以退出本群`,
                    ]
                    Bot.pickGroup(e.group_id).sendMsg(msg)
                }
                else if (operator_id != user_id) {
                    let { nickname } = await Bot.getStrangerInfo(user_id)
                    let member = Bot.pickGroup(group_id).pickMember(operator_id);
                    let memebrName = member.info.card || member.info.nickname
                    let msg = [
                        `退群通知：\n`,
                        `${nickname}(${user_id})以被管理${memebrName}(${operator_id})踢出本群`,
                    ]
                    Bot.pickGroup(e.group_id).sendMsg(msg)
                }
            }
        }
        else if (gainType == 'ban') {
            let groupcfg = new YamlReader(pathAddr + '/plugins/example/config/' + e.group_id + '.yaml', true)
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

export class GroupExam extends plugin {
    dirPath = path.resolve('./plugins/example/config')

    constructor() {
        super({
            name: '群申请处理',
            dsc: '群申请处理',
            event: 'request.group.add',
            priority: -1,
        })
    }

    async accept(e) {
        const group_id = e.group_id, user_id = e.user_id, comment = e.comment
        console.log(group_id + '---' + user_id)
        if (!config.get('group').includes(group_id)) return false
        let groupcfg = new YamlReader(pathAddr + '/plugins/example/config/' + group_id + '.yaml', true)
        let comment_split = comment.split("答案：")
        let cm = (comment_split && comment_split[1]) ? comment_split[1].replace(/[\r\n]/g, "") : ""
        if (groupcfg.get('comment').includes(cm)) e.approve(true)
    }
}
