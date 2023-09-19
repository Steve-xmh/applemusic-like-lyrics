import classNames from "classnames";
import "./text-field.sass";
import { FC, HTMLProps, PropsWithRef } from "react";

export const TextField: FC<
	{
		errorText?: string;
	} & PropsWithRef<HTMLProps<HTMLInputElement>>
> = ({ className, errorText, label, ...props }) => {
	return (
		<>
			{label && <div className="appkit-text-field-label">{label}</div>}
			<input
				className={classNames(
					"appkit-text-field ",
					{
						error: !!errorText,
					},
					className,
				)}
				data-error-text={errorText}
				{...props}
			/>
			{errorText && <div className="appkit-text-field-error">{errorText}</div>}
		</>
	);
};
