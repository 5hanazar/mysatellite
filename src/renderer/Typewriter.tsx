import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
	lines: string[];
}

const Typewriter: React.FC<TypewriterProps> = ({ lines }) => {
	const [currentText, setCurrentText] = useState('');
	const first = useRef(true);
	useEffect(() => {
		if (first.current) {
			init();
			return;
		}
		let text = ""
		for (let j = 0; j < lines.length; j++) {
			text += lines[j] + '\n';
		}
		setCurrentText(text);
	}, [lines]);
	const init = async () => {
		for (let j = 0; j < lines.length; j++) {
			for (let i = 0; i < lines[j].length; i++) {
				setCurrentText((value) => value + lines[j][i]);
				await new Promise((r) => setTimeout(r, 30));
			}
			setCurrentText((value) => value + '\n');
		}
		first.current = false
	};

	return <div style={{ whiteSpace: 'pre-line' }}>{currentText}</div>;
};

export default Typewriter;
