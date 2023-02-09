import { segment } from "oicq";
import fetch from "node-fetch";

import schedule from "node-schedule";

import child_process from "child_process";

const send_err_qq = 1;/*此处填写指令执行错误，将错误信息发送的QQ,必须为机器人的好友*/ 

schedule.scheduleJob("0 30 0 * * ?"/*此处为定时，可自行修改*/, async () => {
	let cmd = ""/*此处填写你需要执行的指令*/
	child_process.exec(cmd, function (error, stdout, stderr) {
		if (error) {
			let msg=['操作失败，原因为：' ,stderr];
			Bot.pickFriend(send_err_qq).sendMsg(msg);
		}
	})
})