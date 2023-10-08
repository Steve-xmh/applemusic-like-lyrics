import type { FunctionComponent, HTMLProps, Key, ReactNode } from "react";
import { useState } from "react";
import "./select.sass";
import classNames from "classnames";
import { Menu, MenuItem } from "../menu";

export interface SelectProps<T extends Key> {
	value: T;
	data: {
		value: T;
		label: string;
	}[];
	onChange: (key: T) => void;
}

type ComposedSelectProps<T extends Key> = SelectProps<T> &
	Omit<HTMLProps<HTMLDivElement>, keyof SelectProps<T>>;

export function Select<T extends Key>(
	props: ComposedSelectProps<T>,
): ReactNode {
	const { className, value, data, onChange, ...otherProps } = props;
	const [opened, setOpened] = useState(false);
	return (
		<div
			className={classNames("appkit-select", className)}
			onClick={(evt) => {
				if (evt.target === evt.currentTarget) {
					setOpened(true);
					evt.stopPropagation();
				}
			}}
			{...otherProps}
		>
			{data.find((v) => v.value === value)?.label ?? String(value)}
			<div className="appkit-select-stepper">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="8"
					height="10"
					style={{
						width: "8px",
						height: "10px",
					}}
					viewBox="0 0 8 10"
					fill="none"
				>
					<path
						d="M4 0C3.74868 0.00344234 3.55649 0.0860585 3.34952 0.275387L0.714361 2.79518C0.566526 2.93287 0.5 3.08778 0.5 3.28399C0.5 3.67642 0.843717 4 1.25766 4C1.46832 4 1.6642 3.92083 1.82313 3.76592L3.99261 1.65577L6.17318 3.76592C6.3321 3.91738 6.52798 4 6.74234 4C7.15628 4 7.5 3.67642 7.5 3.28399C7.5 3.09122 7.42978 2.93632 7.28564 2.79518L4.64678 0.275387C4.43981 0.0826162 4.24393 0 4 0Z"
						fill="#FEFEFF"
					/>
					<path
						d="M4 10C3.74868 9.99656 3.55649 9.91394 3.34952 9.72461L0.714361 7.20482C0.566526 7.06713 0.5 6.91222 0.5 6.71601C0.5 6.32358 0.843717 6 1.25766 6C1.46832 6 1.6642 6.07917 1.82313 6.23408L3.99261 8.34423L6.17318 6.23408C6.3321 6.08262 6.52798 6 6.74234 6C7.15628 6 7.5 6.32358 7.5 6.71601C7.5 6.90878 7.42978 7.06368 7.28564 7.20482L4.64678 9.72461C4.43981 9.91738 4.24393 10 4 10Z"
						fill="#FEFEFF"
					/>
				</svg>
			</div>
			<Menu opened={opened} onClose={() => setOpened(false)}>
				{data.map((item) => (
					<MenuItem
						key={item.value}
						onClick={() => {
							onChange(item.value);
							setOpened(false);
						}}
						label={item.label}
					/>
				))}
			</Menu>
		</div>
	);
}
