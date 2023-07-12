import React from "react";
import { warn } from "../utils/logger";
import { Title } from "@mantine/core";

export class ErrorBoundary extends React.Component<
	{
		children: React.ReactNode;
	},
	{
		hasError: boolean;
		error?: Error;
	}
> {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error: error };
	}

	componentDidCatch(error, errorInfo) {
		warn(error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return (
				<div className="amll-error-boundary">
					<Title order={2}>哦不，出大事情了</Title>
					<div>发生了不可恢复的错误，给作者送 Issue 吧（</div>
					<div>
						如果可以，请尝试使用开发版本复现这个错误，这样子下面的错误信息会更加准确。
					</div>
					<pre>{this.state.error?.name}</pre>
					<pre>{this.state.error?.message}</pre>
					<pre>{this.state.error?.stack}</pre>
				</div>
			);
		}

		return this.props.children;
	}
}
