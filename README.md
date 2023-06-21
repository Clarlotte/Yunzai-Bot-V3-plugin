# Yunzai-Bot V3 plugin

#### 介绍
- 基于Yunzai-Bot V3开发的插件，仅支持Yunzai-Bot V3，建议Bot为群主时使用该插件
- 目前功能有设置和取消管理（机器人必须是群主），以及踢出群成员
- 将js文件放置在/root/Yunzai-Bot/plugins/example下，同时，lzy文件夹放在/Miao-Yunzai/resources下，然后重启云崽即可食用 
- config.yaml中的master请自行进行添加

#### GroupSettings.js
- 设置和取消管理员（前提是Bot必须是群主）,踢出群成员
- 踢出群成员，管理之间不能相互踢，但是主人能命令机器人踢出管理（此前提是机器人必须是群主）
- 设置头衔以及撤销头衔
- 基本情况都有考虑到，根据不同的情况有不同的提示
- 具体用法请看脚本注释
##### 指令：
- #设置管理@XXX
- #取消管理@XXX
- #踢@XXX
- #我要头衔xxx
- #撤销头衔@XXX  
- #我不要头衔了  （这两个命令的区别在于，一个是他自己本人不要头衔，一个是主人对群成员的头衔进行撤销）
- #设置(头衔违禁词|发言违禁词)XXX
- #设置群管XXX（为纯数字，私聊进行使用，目的是添加你需要机器人使用此插件的群） 
- #设置禁言时长XXX （为纯数字，如果后面没有加数字，则默认修改为10分钟，请使用60的整数）  

[GitHub项目地址](https://github.com/Clarlotte/Yunzai-Bot-V3-plugin)
