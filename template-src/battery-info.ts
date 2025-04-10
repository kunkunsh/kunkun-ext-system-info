import {
	Action,
	expose,
	Form,
	fs,
	Icon,
	IconEnum,
	List,
	os,
	path,
	shell,
	sysInfo,
	toast,
	ui,
	utils,
	TemplateUiCommand,
	type ListSchema
} from '@kksh/api/ui/template';
import { getMacBatteryInfo } from './mac-ioreg';

async function parseBatteryInfo(
	batteries: Awaited<ReturnType<typeof sysInfo.batteries>>
): Promise<List.Section[]> {
	const platform = await os.platform();
	return batteries.map((battery) => {
		const items: List.Item[] = [];
		// TODO: not sure what the unit is for time_to_empty, time_to_full, and energy_rate
		// if (battery.time_to_empty) {
		// 	items.push(
		// 		new List.Item({
		// 			title: "Time Remaining",
		// 			value: "time-remaining",
		// 			subTitle: battery.time_to_empty.toString()
		// 		})
		// 	)
		// }
		// if (battery.time_to_full) {
		// 	items.push(
		// 		new List.Item({
		// 			title: "Time to Full",
		// 			value: "time-to-full",
		// 			subTitle: battery.time_to_full.toString()
		// 		})
		// 	)
		// }
		items.push(
			new List.Item({
				title: 'Voltage',
				value: 'voltage',
				subTitle: `${battery.voltage.toFixed(2).toString()}V`,
				icon: new Icon({
					type: IconEnum.Iconify,
					value: 'openmoji:high-voltage'
				})
			})
		);
		if (battery.temperature_kelvin) {
			// temperature C and F are derived from kelvin under the hood, so we can use the same value for all
			items.push(
				new List.Item({
					title: 'Temperature',
					value: 'temperature',
					subTitle: `${battery.temperature_celsius?.toFixed(2)}°C / ${battery.temperature_fahrenheit?.toFixed(2)}°F`,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'uil:temperature-half'
					})
				})
			);
		}
		items.push(
			new List.Item({
				title: 'State',
				value: 'state',
				subTitle: battery.state.toString(),
				icon: new Icon({
					type: IconEnum.Iconify,
					value: 'tabler:plug'
				})
			})
		);
		items.push(
			new List.Item({
				title: 'Cycle Count',
				value: 'cycle-count',
				subTitle: battery.cycle_count?.toString() ?? '--',
				icon: new Icon({
					type: IconEnum.Iconify,
					value: 'material-symbols:cycle'
				})
			})
		);
		if (platform !== 'macos') {
			items.push(
				new List.Item({
					title: 'Percentage',
					value: 'percentage',
					subTitle: `${(battery.state_of_charge * 100).toFixed(2)}%`
				})
			);
		}
		items.push(
			new List.Item({
				title: 'Health',
				value: 'health',
				subTitle: `${(battery.state_of_health * 100).toFixed(2)}%`,
				icon: new Icon({
					type: IconEnum.Iconify,
					value: 'map:health'
				})
			})
		);
		return new List.Section({
			items
		});
	});
}

async function getBatteryInSections(): Promise<List.Section[]> {
	const platform = await os.platform();
	const batteries = await sysInfo.batteries();
	const sections: List.Section[] = await parseBatteryInfo(batteries);
	if (platform === 'macos') {
		// mac is expected to have only one battery
		const macInfo = await getMacBatteryInfo();
		if (macInfo) {
			sections[0].items = [
				new List.Item({
					title: 'Percentage',
					value: 'percentage',
					subTitle: `${macInfo.CurrentCapacity.toString()}%`,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'ic:outline-percentage'
					})
				}),
				new List.Item({
					title: 'Time Remaining',
					value: 'time-remaining',
					subTitle: macInfo.timeRemainingFormatted,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'mdi:clock-outline'
					})
				}),
				new List.Item({
					title: 'Power Source',
					value: 'power-source',
					subTitle: macInfo.formattedPowerSource,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'ic:outline-power'
					})
				}),
				new List.Item({
					title: 'Condition',
					value: 'condition',
					subTitle: macInfo.formattedCondition,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'emojione:battery'
					})
				}),
				new List.Item({
					title: 'Charge',
					value: 'charge',
					subTitle: macInfo.formattedCurrentCapacity,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'emojione:battery'
					})
				}),
				new List.Item({
					title: 'Power Usage',
					value: 'power-usage',
					subTitle: macInfo.powerUsage,
					icon: new Icon({
						type: IconEnum.Iconify,
						value: 'emojione:battery'
					})
				}),
				...sections[0].items
			];
		}
	}
	return sections;
}

async function run() {
	getBatteryInSections().then((sections) => {
		ui.render(
			new List.List({
				sections
			})
		);
	});
}

class BatteryInfo extends TemplateUiCommand {
	intervalId: NodeJS.Timer | null = null;
	async onBeforeGoBack() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.intervalId = null;
	}
	load() {
		ui.setSearchBarPlaceholder('Search...');
		ui.render(
			new List.List({
				items: []
			})
		);
		this.intervalId = setInterval(() => {
			console.log('Battery info updated');
			run();
		}, 10_000);
		return run();
	}
}

expose(new BatteryInfo());
