import { FC } from "react";
import { atomWithConfig } from "./atom-with-config";
import { useAtom } from "jotai";
import { Switch } from "../appkit/switch/switch";

export const SwitchConfigComponent: FC<{
	atom: ReturnType<typeof atomWithConfig<boolean>>;
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
