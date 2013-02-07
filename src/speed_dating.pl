#!/usr/bin/perl
use strict;
use warnings;
use List::MoreUtils qw{part any};
use Mail::Sender;
use Carp;
use YAML qw/LoadFile DumpFile/;

my $send = shift || 0;


my $sender = {};
if ($send) {
	carp(q{DO NOT RUN ME... YOU ALREADY DID!});
	$sender = Mail::Sender->new(
		{ 
			 smtp => 'mail.nerdnite.com', 
			 from => 'austin@nerdnite.com' ,
			 auth => 'LOGIN',
			 authid => 'austin+nerdnite.com',
			 authpwd => '0pald1v1nes',
		} );
}
else {
	bless $sender => 'main';
}

sub MailMsg {
	my $self    = shift;
	my $options = shift;

	my $recipients = join ', ', @{ $options->{to} };
	print "Email to: $recipients\n";
	print "Not sending this email\n";
	return 1;
}

my $daters = LoadFile('good_set_feb');

foreach my $dater ( @{$daters} ) {
	print <<"END_DATER";
First Name: $dater->{name}->[0]
First Name: $dater->{name}->[1]
Gender: $dater->{gender}
Email: $dater->{email}

END_DATER
}

my %gender = ( M => 0, F => 1 );

my @gendered_daters = part { $gender{ $_->{gender} } } @{$daters};
my %daters_by_gender = (
    M => {map { $_->{id} => $_ } @{ $gendered_daters[0] }},
    F => {map { $_->{id} => $_ } @{ $gendered_daters[1] }},
);

foreach my $chooser ( values %{$daters_by_gender{F}} ) {
	my $found_matches = 0;
	foreach my $liked_gent ( @{ $chooser->{choices} } ) {
		my $chosen = $daters_by_gender{M}->{$liked_gent};
		if ( any { $_ eq $chooser->{id} } @{ $chosen->{choices} } ) {
			$chosen->{matches} ||= 0;
			print <<"END_MATCH";
$chooser->{name}->[0] $chooser->{name}->[1] matches with $chosen->{name}->[0] $chosen->{name}->[1]
END_MATCH
			matched( $chooser, $chosen );
			$found_matches++;
			$chosen->{matches}++;
		}
	}
	if ( !$found_matches ) {
		print <<"END_MATCH";
$chooser->{name}->[0] $chooser->{name}->[1] did not match with anyone
END_MATCH
		lonely($chooser);
	}
}

foreach my $chosen ( values %{$daters_by_gender{M}} ) {
	if ( !$chosen->{matches} ) {
		print <<"END_MATCH";
$chosen->{name}->[0] $chosen->{name}->[1] did not match with anyone
END_MATCH
		lonely($chosen);
	}
}

sub lonely {
	my $dater = shift or die("Where's the damned dater?");
	my $message = <<"END_MESSAGE";
Dear $dater->{name}->[0],

Thanks so much for coming to Nerd Nite Speed Dating on Wednesday.

We hope you had a good time during the event.

Although a number of daters expressed an interest in meeting you again, they did not match up with those you expressed an interest in seeing again. In the final tally, there were no matches for you last night.

We hope you don't lose heart, though and had fun, nonetheless.

We're running Speed Dating every month, so feel free to come again: http://austin.nerdnite.com/speed-dating

Nerd Nite Cupid	
END_MESSAGE

	my $result = $sender->MailMsg(
		{
			to      => [ $dater->{email} ],
			bcc     => 'austin@nerdnite.com',
			subject => 'Nerd Nite Speed Dating',
			msg     => $message,
		}
	) or croak(q{Didn't work});
	if($result < 0) {
       croak($Mail::Sender::Error); 
    }
	return;
}

sub matched {
	my $chooser = shift or croak(q{Where's the damned lady?});
	my $chosen = shift or croak(q{Where's the damned dude?});
	my $message = <<"END_MESSAGE";
Dear $chooser->{name}->[0] and $chosen->{name}->[0],

Thanks so much for coming to Nerd Nite Speed Dating on Wednesday.

We hope you had a good time during the event; you both expressed an interest in meeting up again and this is where we hand the reins over to you! You now have each other's email address. Just remember not to 'Reply-All' or you'll be including us on your emails :o)

Good luck,

Nerd Nite Cupid 
END_MESSAGE

	my $result = $sender->MailMsg(
		{
			to      => [ $chooser->{email}, $chosen->{email} ],
			bcc     => 'austin@nerdnite.com',
			subject => 'Nerd Nite Speed Dating',
			msg     => $message,
		}
	) or croak(q{Didn't work});
	if($result < 0) {
	   croak($Mail::Sender::Error);	
	}
	return;
}

