import * as React from "react";
import { useConfig } from "../api/react";
import { ColorInput, TextInput, TextInputProps } from "@mantine/core";
import { Switch } from "../components/appkit/switch";
import { Slider } from "../components/appkit/slider";

export const SwitchConfigComponent: React.FC<{
	settingKey: string;
	defaultValue?: boolean;
	label: string;
	description?: string;
	disabled?: boolean;
}> = (props) => {
	const [rawValue, setSettingValue] = useConfig(
		props.settingKey,
		String(!!props.defaultValue),
	);
	const settingValue = React.useMemo(() => rawValue === "true", [rawValue]);
	return (
		<div className="amll-switch-config">
			<Switch
				disabled={props.disabled}
				selected={settingValue}
				onClick={() => setSettingValue(String(!settingValue))}
				beforeSwitch={
					<div className="amll-config-text">
						<div className="amll-config-label">{props.label}</div>
						<div className="amll-config-description">{props.description}</div>
					</div>
				}
			/>
		</div>
	);
};

export const TextConfigComponent: React.FC<
	TextInputProps & {
		settingKey: string;
		defaultValue: string;
	}
> = (props) => {
	const [settingValue, setSettingValue] = useConfig(
		props.settingKey,
		props.defaultValue,
	);
	const {
		onChange: _onChange,
		settingKey: _settingKey,
		defaultValue: _defaultValue,
		...otherProps
	} = props;
	return (
		<TextInput
			sx={{ margin: "8px 0" }}
			value={settingValue}
			onChange={(evt) => setSettingValue(evt.currentTarget.value)}
			{...otherProps}
		/>
	);
};

export const ColorConfigComponent: React.FC<
	TextInputProps & {
		settingKey: string;
		defaultValue: string;
	}
> = (props) => {
	const { settingKey, ...otherProps } = props;
	const [settingValue, setSettingValue] = useConfig(
		settingKey,
		props.defaultValue,
	);
	return (
		<ColorInput
			sx={{ margin: "8px 0" }}
			format="hexa"
			value={settingValue}
			onChange={setSettingValue}
			withEyeDropper
			{...otherProps}
		/>
	);
};

export const SliderConfigComponent: React.FC<{
	settingKey: string;
	min?: number;
	max?: number;
	defaultValue?: number;
	step?: number;
	label: string;
	description?: string;
	disabled?: boolean;
	formatLabel?: (v: number) => string;
}> = (props) => {
	const [rawValue, setSettingValue] = useConfig(props.settingKey);
	const settingValue = React.useMemo(
		() => Number(rawValue) || props.defaultValue,
		[rawValue, props.defaultValue],
	);
	return (
		<div className="amll-slider-config">
			<div className="amll-config-text">
				<div className="amll-config-label">{props.label}</div>
				<div className="amll-config-description">{props.description}</div>
			</div>
			<Slider
				disabled={props.disabled}
				step={props.step}
				min={props.min}
				max={props.max}
				defaultValue={props.defaultValue}
				value={settingValue}
				onChange={(v) => setSettingValue(String(v))}
			/>
		</div>
	);
};
