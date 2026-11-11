// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

package fresheye

import "unicode/utf8"

// SimpleWordDescriptor describes the position of a word in a string.
type SimpleWordDescriptor struct {
	start, end int
}

type simpleWordIterator struct {
	text               string
	wordStart, wordEnd int
	prevEnd            int
	newParagraph       bool
	first              bool

	index int
}

func russianLetter(r rune) bool {
	return r >= 'а' && r <= 'я' || r >= 'А' && r <= 'Я' || r == 'ё' || r == 'Ё'
}

// Start returns the start position of a word in text.
func (w *SimpleWordDescriptor) Start() int { return w.start }

// End returns the end position of a word in text.
func (w *SimpleWordDescriptor) End() int { return w.end }

// NewSimpleWordIterator returns a WordIterator that will return words from text one by one.
func NewSimpleWordIterator(text string) WordIterator {
	return &simpleWordIterator{
		text:  text,
		first: true,
	}
}

func (w *simpleWordIterator) Next() bool {
	w.newParagraph = w.first
	w.first = false

	i := w.index
	start, end := -1, -1
	for i < len(w.text) {
		r, size := utf8.DecodeRuneInString(w.text[i:])
		if russianLetter(r) {
			start, end = i, i+size
			break
		}
		if r == '\n' {
			w.newParagraph = true
		}
		i += size
	}
	if start == -1 {
		w.index = i
		return false
	}
	for i < len(w.text) {
		r, size := utf8.DecodeRuneInString(w.text[i:])
		i += size
		if !russianLetter(r) {
			break
		}
		end = i
	}
	w.wordStart, w.wordEnd = start, end
	w.prevEnd, w.index = w.index, end
	return true
}

func (w *simpleWordIterator) Word() string         { return w.text[w.wordStart:w.wordEnd] }
func (w *simpleWordIterator) Sep() string          { return w.text[w.prevEnd:w.wordStart] }
func (w *simpleWordIterator) ParagraphStart() bool { return w.newParagraph }
func (w *simpleWordIterator) Descriptor() WordDescriptor {
	return &SimpleWordDescriptor{w.wordStart, w.wordEnd}
}

// WordDescriptors extracts unique word descriptors from a slice of bad word pairs.
func WordDescriptors(bad []BadPair) []WordDescriptor {
	m := make(map[WordDescriptor]struct{})
	for _, p := range bad {
		m[p.First] = struct{}{}
		m[p.Second] = struct{}{}
	}
	wd := make([]WordDescriptor, 0, len(m))
	for d := range m {
		wd = append(wd, d)
	}
	return wd
}
