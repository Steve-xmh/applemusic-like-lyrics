import { FC } from "react";
import { atomWithConfig } from "./atom-with-config";
import { WritableAtom, useAtom } from "jotai";
import { Switch } from "../appkit/switch/switch";
import { Loadable } from "jotai/vanilla/utils/loadable";
import { TextField } from "../appkit/text-field";

export const ColorConfigComponent: FC<{
	atom: ReturnType<typeof atomWithConfig<string>>;
	label: string;
	description?: string;
	disabled?: boolean;
}> = (props) => {
	const [configValue, setConfigValue] = useAtom(props.atom);
	return (
		<div
			style={{
				display: "flex",
				gap: "8px",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<div className="amll-config-text">
				<div className="amll-config-label">{props.label}</div>
				<div className="amll-config-description">{props.description}</div>
			</div>
			<input
				type="color"
				style={{
					background: "none",
					border: "none",
				}}
				value={configValue}
				onInput={(e) => setConfigValue(e.currentTarget.value)}
			/>
		</div>
	);
};

export const NumberTextFieldConfigComponent: FC<{
	atom: WritableAtom<number, [number], any>;
	label: string;
	description?: string;
	disabled?: boolean;
}> = (props) => {
	const [configValue, setConfigValue] = useAtom(props.atom);
	return (
		<div
			style={{
				display: "flex",
				gap: "8px",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<div className="amll-config-text">
				<div className="amll-config-label">{props.label}</div>
				<div className="amll-config-description">{props.description}</div>
			</div>
			<TextField
				style={{
					width: "8em",
				}}
				value={configValue}
				onChange={(e) => setConfigValue(Number(e.currentTarget.value))}
				type="number"
			/>
		</div>
	);
};

export const SwitchConfigComponent: FC<{
	atom: WritableAtom<Promise<boolean> | boolean, [boolean], any>;
	label: string;
	description?: string;
	disabled?: boolean;
}> = (props) => {
	const [configValue, setConfigValue] = useAtom(props.atom);
	return (
		<div className="amll-switch-config">
			<Switch
				disabled={props.disabled}
				selected={configValue}
				onClick={() => setConfigValue(!configValue)}
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

export const SwitchLoadableConfigComponent: FC<{
	atom: WritableAtom<Loadable<boolean>, [boolean], any>;
	label: string;
	description?: string;
	disabled?: boolean;
}> = (props) => {
	const [configValue, setConfigValue] = useAtom(props.atom);
	return (
		<div className="amll-switch-config">
			<Switch
				disabled={props.disabled && configValue.state !== "hasData"}
				selected={configValue.state === "hasData" && configValue.data}
				onClick={() =>
					setConfigValue(!(configValue.state === "hasData" && configValue.data))
				}
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
