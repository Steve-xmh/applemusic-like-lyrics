use skia_safe::{
    textlayout::{
        FontCollection, Paragraph, ParagraphBuilder, ParagraphStyle, TextStyle,
        TypefaceFontProvider,
    },
    Canvas, Color4f, Font, FontMgr, Paint, Point, Rect, TextBlob, Typeface,
};
use tracing::*;

#[derive(Debug)]
struct LyricLineElement {
    pub line: ws_protocol::LyricLine,
    pub rect: Rect,
    pub paragraph: Option<Paragraph>,
    pub sub_paragraph: Option<Paragraph>,
}

#[derive(Debug)]
pub struct LyricRenderer {
    pingfang_type_face: Typeface,
    sf_pro_type_face: Typeface,
    rect: Rect,
    lines: Vec<LyricLineElement>,
}

impl LyricRenderer {
    pub fn new(pingfang_type_face: Typeface, sf_pro_type_face: Typeface) -> Self {
        Self {
            pingfang_type_face,
            sf_pro_type_face,
            rect: Rect::new_empty(),
            lines: Vec::with_capacity(1024),
        }
    }

    pub fn set_progress(&mut self, progress: f64) {}

    pub fn set_lines(&mut self, lines: Vec<ws_protocol::LyricLine>) {
        self.lines.clear();
        for line in lines {
            self.lines.push(LyricLineElement {
                line,
                rect: Rect::new_empty(),
                paragraph: None,
                sub_paragraph: None,
            });
        }
        self.layout();
    }

    pub fn render(&mut self, canvas: &Canvas) {
        canvas.save();

        let font = Font::from_typeface(&self.pingfang_type_face, 16.);
        let text = "Lyric Player";
        let tb = TextBlob::new(text, &font).unwrap();
        canvas.draw_text_blob(
            &tb,
            (self.rect.left, tb.bounds().height() + self.rect.top),
            &skia_safe::Paint::new(Color4f::new(1., 1., 1., 1.), None),
        );

        let mut point = Point::new(self.rect.left, self.rect.top);
        for line in &self.lines {
            if let Some(param) = &line.paragraph {
                param.paint(canvas, point);
                canvas.draw_rect(
                    Rect::from_xywh(point.x, point.y, param.max_width(), param.height()),
                    Paint::new(Color4f::new(1., 0., 0., 0.), None)
                        .set_stroke(true)
                        .set_stroke_width(1.),
                );
                point.y += param.height();
            }
            if let Some(param) = &line.sub_paragraph {
                param.paint(canvas, point);
                canvas.draw_rect(
                    Rect::from_xywh(point.x, point.y, param.max_width(), param.height()),
                    Paint::new(Color4f::new(0., 1., 0., 0.), None)
                        .set_stroke(true)
                        .set_stroke_width(1.),
                );
                point.y += param.height();
            }
        }
        canvas.restore();
    }

    pub fn set_rect(&mut self, rect: Rect) {
        self.rect = dbg!(rect);
        self.layout();
    }

    pub fn layout(&mut self) {
        let width = self.rect.width();
        let mut font_collection = FontCollection::new();
        let font_mgr = FontMgr::new();
        font_collection
            .set_default_font_manager_and_family_names(font_mgr, &["SF Pro", "PingFang SC"]);
        let mut param_style = ParagraphStyle::new();
        param_style.set_text_style(TextStyle::new().set_font_size(self.rect.height() * 0.05));
        let mut sub_param_style = ParagraphStyle::new();
        sub_param_style.set_text_style(
            TextStyle::new()
                .set_font_size(self.rect.height() * 0.025)
                .set_foreground_paint(&Paint::new(Color4f::new(1.0, 1.0, 1.0, 0.5), None)),
        );
        let mut tf_provider = TypefaceFontProvider::new();
        tf_provider.register_typeface(
            self.pingfang_type_face.clone(),
            Some(self.pingfang_type_face.family_name()),
        );
        tf_provider.register_typeface(
            self.sf_pro_type_face.clone(),
            Some(self.sf_pro_type_face.family_name()),
        );
        font_collection.set_asset_font_manager(Some(tf_provider.into()));
        for line in &mut self.lines {
            let mut param = ParagraphBuilder::new(&param_style, font_collection.clone());
            for word in &line.line.words {
                param.add_text(&word.word);
            }
            let mut paragraph = param.build();
            paragraph.layout(width);
            line.paragraph = Some(paragraph);
            let sub_line = line.line.translated_lyric.as_ref().to_string()
                + "\n"
                + line.line.roman_lyric.as_ref();
            if sub_line.trim().is_empty() {
                line.sub_paragraph = None;
            } else {
                let mut param = ParagraphBuilder::new(&sub_param_style, font_collection.clone());
                param.add_text(sub_line.trim());
                let mut paragraph = param.build();
                paragraph.layout(width);
                line.sub_paragraph = Some(paragraph);
            }
            // debug!("Layouted line: {:?}", line);
        }
    }
}
