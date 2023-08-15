import classNames from "classnames";
import "./text-field.sass";
import { FC, HTMLProps, PropsWithRef } from "react";

export const TextField: FC<
	{
		errorText?: string;
	} & PropsWithRef<HTMLProps<HTMLInputElement>>
> = ({ className, errorText, ...props }) => {
	return (
		<>
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
